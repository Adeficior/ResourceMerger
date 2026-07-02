import {
  afterFinalize,
  distributedAcceptor,
  extendContext,
  simpleAcceptor,
  supplyAcceptorContext,
  type Acceptable,
  type Acceptor,
  type ContextLike,
} from "@adeficior/pack-resolver";
import type { MergeStrategy } from "./strategy/index.js";
import LangMerger from "./strategy/lang.js";
import ModelMerger from "./strategy/models.js";
import TagMerger from "./strategy/tags.js";

type WithSources<T extends ContextLike> = Omit<T, "source"> & {
  source: string[];
};

function sourceOf(context: ContextLike): string[] {
  if ("source" in context) {
    if (typeof context.source === "string") return [context.source];
    if (Array.isArray(context.source))
      return context.source.filter((it) => typeof it === "string");
  }

  return [];
}

export function mergingAcceptor<Context extends ContextLike>(
  acceptor: Acceptor<Acceptable, WithSources<Context>>,
  strategy: MergeStrategy,
): Acceptor<Acceptable, Context> {
  const cache = new Map<
    string,
    { data: Acceptable; context: WithSources<Context> }
  >();

  const transformer = simpleAcceptor<Acceptable, Context>(
    async (path, content, context) => {
      const data = await content;
      const cached = cache.get(path);
      const sources = sourceOf(context);

      if (cached) {
        const merged = strategy.merge(cached.data, data);
        // TODO combined context somehow?
        cache.set(path, {
          data: merged,
          context: extendContext(cached.context, {
            source: [...cached.context.source, ...sources],
          }),
        });
      } else {
        cache.set(path, {
          data,
          context: extendContext(context, { source: sources }),
        });
      }
    },
  );

  return afterFinalize(transformer, async () => {
    await Promise.all(
      [...cache].map(([path, { data, context }]) => {
        acceptor.accept(path, Promise.resolve(data), context);
      }),
    );

    if (acceptor.finalize) await acceptor.finalize();
  });
}

export function createMergingAcceptor<Context extends ContextLike>(
  acceptor: Acceptor<Acceptable, WithSources<Context>>,
): Acceptor<Acceptable, Context> {
  const withoutFinalize: typeof acceptor = {
    accept: acceptor.accept,
  };
  const merging = distributedAcceptor(
    {
      "assets/*/models/**/*.json": mergingAcceptor(
        withoutFinalize,
        ModelMerger,
      ),
      "assets/*/lang/**/*.json": mergingAcceptor(withoutFinalize, LangMerger),
      "data/*/tags/**/*.json": mergingAcceptor(withoutFinalize, TagMerger),
    },
    supplyAcceptorContext(withoutFinalize, { source: [] }),
  );

  if (acceptor.finalize) return afterFinalize(merging, acceptor.finalize);
  return merging;
}
