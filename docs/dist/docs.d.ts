//#region src/docs.d.ts
interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo: string;
  npm: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: {
    html: string;
    js: string;
    css: string;
  };
  selectors: Array<{
    name: string;
    selector: string;
    description: string;
  }>;
  keyboard: Array<{
    key: string;
    behavior: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  events: Array<{
    name: string;
    detail: string;
    trigger?: string;
    target?: string;
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  }>;
  examples: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  accessibility: string[];
}
declare const docs: PluginDocs;
//#endregion
export { PluginDocs, docs };
//# sourceMappingURL=docs.d.ts.map