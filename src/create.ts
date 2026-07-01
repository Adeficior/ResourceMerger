import {
  afterFinalize,
  distributedAcceptor,
  simpleAcceptor,
  type Acceptable,
  type Acceptor,
} from "@adeficior/pack-resolver";
import type { MergeStrategy } from "./strategy/index.js";
import LangMerger from "./strategy/lang.js";
import ModelMerger from "./strategy/models.js";
import TagMerger from "./strategy/tags.js";

export function mergingAcceptor(
  acceptor: Acceptor,
  strategy: MergeStrategy,
): Acceptor {
  const cache = new Map<string, Acceptable>();

  const transformer = simpleAcceptor(async (path, data) => {
    const content = await data;
    const cached = cache.get(path);
    if (cached) {
      const merged = strategy.merge(cached, content);
      cache.set(path, merged);
    } else {
      cache.set(path, content);
    }
  });

  return afterFinalize(transformer, async () => {
    await Promise.all(
      [...cache].map(([path, data]) => {
        acceptor.accept(path, Promise.resolve(data));
      }),
    );

    if (acceptor.finalize) await acceptor.finalize();
  });
}

export function createMergingAcceptor(acceptor: Acceptor): Acceptor {
  const withoutFinalize: Acceptor = { accept: acceptor.accept };
  const merging = distributedAcceptor(
    {
      "assets/*/models/**/*.json": mergingAcceptor(
        withoutFinalize,
        ModelMerger,
      ),
      "assets/*/lang/**/*.json": mergingAcceptor(withoutFinalize, LangMerger),
      "data/*/tags/**/*.json": mergingAcceptor(withoutFinalize, TagMerger),
    },
    withoutFinalize,
  );

  if (acceptor.finalize) return afterFinalize(merging, acceptor.finalize);
  return merging;
}
