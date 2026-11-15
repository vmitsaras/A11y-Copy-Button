import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  A11yCopyButton,
  COPY_BUTTON_EVENTS,
  createCopyButton,
  initCopyButtonAll,
  type CopyButtonAddon,
  type CopyButtonInstance
} from "../src/index";

const writeText = vi.fn<(data: string) => Promise<void>>();

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setClipboard(value: Clipboard | undefined): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value
  });
}

function createButton(markup = "Copy"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-a11y-copy-button", "");
  button.innerHTML = `<span data-a11y-copy-button-label>${markup}</span><span data-a11y-copy-button-status></span>`;
  document.body.append(button);
  return button;
}

async function waitForClick(): Promise<void> {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  setClipboard({ writeText } as unknown as Clipboard);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("A11yCopyButton", () => {
  it("reuses the instance registry after destroy and explicit reinitialization", async () => {
    const button = createButton();
    const instance = createCopyButton(button, { value: "one" });
    instance.destroy();
    instance.init();
    expect(createCopyButton(button, { value: "two" })).toBe(instance);
    button.click();
    await waitForClick();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("one");
  });

  it("rejects reinitializing an old instance while another instance owns the root", () => {
    const button = createButton();
    const old = createCopyButton(button);
    old.destroy();
    const current = createCopyButton(button);
    expect(() => old.init()).toThrow(/already initialized/);
    expect(createCopyButton(button)).toBe(current);
  });

  it("restores an authored status added between lifecycles", async () => {
    const button = document.createElement("button");
    button.textContent = "Copy";
    document.body.append(button);
    const instance = createCopyButton(button, { value: "one" });
    instance.destroy();
    const status = document.createElement("span");
    status.setAttribute("data-a11y-copy-button-status", "");
    status.textContent = "Original";
    status.setAttribute("aria-live", "off");
    button.after(status);
    instance.init();
    await instance.copy();
    instance.destroy();
    expect(status.textContent).toBe("Original");
    expect(status.getAttribute("aria-live")).toBe("off");
    expect(status.hasAttribute("role")).toBe(false);
  });

  it("preserves author classes on other elements during cleanup", () => {
    const button = createButton();
    const label = button.querySelector<HTMLElement>("[data-a11y-copy-button-label]")!;
    label.classList.add("a11y-copy-button");
    const instance = createCopyButton(button);
    instance.destroy();
    expect(label.classList.contains("a11y-copy-button")).toBe(true);
    expect(label.classList.contains("a11y-copy-button__label")).toBe(false);
    expect(button.classList.contains("a11y-copy-button")).toBe(false);
  });

  it.each([
    "is-initialized",
    "is-disabled",
    "a11y-copy-button--copying",
    "a11y-copy-button--success",
    "a11y-copy-button--error",
    "is-initialized is-disabled a11y-copy-button--copying a11y-copy-button--success a11y-copy-button--error"
  ])("restores authored root state classes after status changes: %s", async (classes) => {
    const button = createButton();
    button.className = `authored ${classes}`;
    const originalClasses = new Set(button.classList);
    const instance = createCopyButton(button, { value: "one" });

    instance.disable();
    instance.enable();
    await instance.copy();
    instance.setStatus("error");
    instance.reset();
    instance.destroy();
    instance.destroy();

    expect(new Set(button.classList)).toEqual(originalClasses);
  });

  it("captures root state classes again for each lifecycle", () => {
    const button = createButton();
    button.className = "authored is-initialized a11y-copy-button--success";
    const instance = createCopyButton(button);
    instance.destroy();

    button.classList.remove("is-initialized", "a11y-copy-button--success");
    button.classList.add("is-disabled", "a11y-copy-button--error");
    instance.init();
    instance.setStatus("copying");
    instance.destroy();

    expect(new Set(button.classList)).toEqual(new Set([
      "authored", "is-disabled", "a11y-copy-button--error"
    ]));
  });

  it.each(["copying", "success", "error", "disabled"] as const)(
    "removes plugin-generated root state classes on destroy: %s",
    (status) => {
      const button = createButton();
      button.className = "authored";
      const instance = createCopyButton(button);
      instance.setStatus(status);
      instance.destroy();

      expect([...button.classList]).toEqual(["authored"]);
    }
  );

  it("reads the most recent copied value even when it is empty", async () => {
    const instance = createCopyButton(createButton(), { value: "configured", allowEmpty: true });
    expect(instance.getValue()).toBe("configured");
    await instance.copy("other");
    expect(instance.getValue()).toBe("other");
    await instance.copy("");
    expect(writeText).toHaveBeenLastCalledWith("");
    expect(instance.getValue()).toBe("");
    instance.setValue("updated");
    expect(instance.getValue()).toBe("updated");
  });

  it("exports a creation function and class", () => {
    expect(createCopyButton).toBeTypeOf("function");
    expect(A11yCopyButton).toBeTypeOf("function");
  });

  it("initializes a root button", () => {
    const button = createButton();
    const instance = createCopyButton(button, { value: "https://example.com" });

    expect(instance).toBeInstanceOf(A11yCopyButton);
    expect(button.classList.contains("a11y-copy-button")).toBe(true);
    expect(button.classList.contains("is-initialized")).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBeNull();
  });

  it("keeps status outside the button name and restores its original position on destroy", async () => {
    const button = createButton("Copy link");
    const label = button.querySelector("[data-a11y-copy-button-label]");
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]");
    const instance = createCopyButton(button, { value: "https://example.com" });

    expect(button.textContent).toBe("Copy link");
    expect(status?.previousElementSibling).toBe(button);
    expect(status?.getAttribute("role")).toBe("status");

    await instance.copy();
    expect(status?.textContent).toBe("Copied");
    expect(button.textContent).toBe("Copy link");

    instance.destroy();
    expect(status?.parentElement).toBe(button);
    expect(status?.previousElementSibling).toBe(label);
    expect(status?.getAttribute("role")).toBeNull();
  });

  it("uses an author-provided status sibling without generating another one", async () => {
    const button = document.createElement("button");
    button.setAttribute("data-a11y-copy-button", "");
    button.textContent = "Copy link";
    const status = document.createElement("span");
    status.setAttribute("data-a11y-copy-button-status", "");
    document.body.append(button, status);

    const instance = createCopyButton(button, { value: "https://example.com" });
    await instance.copy();

    expect(document.querySelectorAll("[data-a11y-copy-button-status]")).toHaveLength(1);
    expect(status.textContent).toBe("Copied");
    expect(button.textContent).toBe("Copy link");

    instance.destroy();
    expect(status.isConnected).toBe(true);
    expect(status.textContent).toBe("");
  });

  it("places detached button feedback beside the button after attachment", async () => {
    const button = document.createElement("button");
    button.textContent = "Copy link";
    const instance = createCopyButton(button, { value: "one" });
    instance.setStatus("success", "Copied before attachment");
    expect(button.textContent).toBe("Copy link");
    expect(button.querySelector("[data-a11y-copy-button-status]")).toBeNull();

    document.body.append(button);
    await Promise.resolve();
    const status = button.nextElementSibling;
    expect(status?.textContent).toBe("Copied before attachment");
    expect(status?.getAttribute("role")).toBe("status");
    await instance.copy();
    expect(button.textContent).toBe("Copy link");
    expect(status?.textContent).toBe("Copied");
    instance.destroy();
    expect(status?.isConnected).toBe(false);
  });

  it("moves authored status out of a detached button and restores it on destroy", async () => {
    const button = createButton("Copy link");
    button.remove();
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]")!;
    status.textContent = "Original";
    const instance = createCopyButton(button, { value: "one" });
    expect(button.textContent).toBe("Copy link");
    document.body.append(button);
    await Promise.resolve();
    expect(status.previousElementSibling).toBe(button);
    instance.destroy();
    expect(status.parentElement).toBe(button);
    expect(status.textContent).toBe("Original");
    expect(status.hasAttribute("role")).toBe(false);
  });

  it("does not insert pending feedback after a detached instance is destroyed", async () => {
    const button = document.createElement("button");
    button.textContent = "Copy link";
    const instance = createCopyButton(button);
    instance.destroy();
    document.body.append(button);
    await Promise.resolve();
    expect(button.nextElementSibling).toBeNull();
    expect(button.textContent).toBe("Copy link");
    instance.init();
    expect(button.nextElementSibling?.matches("[data-a11y-copy-button-status]")).toBe(true);
    instance.destroy();
  });

  it("places feedback beside a button in a document fragment", () => {
    const fragment = document.createDocumentFragment();
    const button = document.createElement("button");
    button.textContent = "Copy link";
    fragment.append(button);
    const instance = createCopyButton(button);
    expect(button.nextElementSibling?.matches("[data-a11y-copy-button-status]")).toBe(true);
    expect(button.textContent).toBe("Copy link");
    instance.destroy();
    expect(fragment.childNodes).toHaveLength(1);
  });

  it("retries pending status placement when feedback updates in a shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    button.textContent = "Copy link";
    const instance = createCopyButton(button);
    shadow.append(button);
    instance.setStatus("error", "Copy failed");
    expect(button.textContent).toBe("Copy link");
    expect(button.nextElementSibling?.textContent).toBe("Copy failed");
    instance.destroy();
    expect(shadow.childNodes).toHaveLength(1);
  });

  it("restores authored detached status when destroyed before attachment", async () => {
    const button = createButton("Copy link");
    button.remove();
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]")!;
    status.textContent = "Original";
    const instance = createCopyButton(button);
    instance.destroy();
    document.body.append(button);
    await Promise.resolve();
    expect(status.parentElement).toBe(button);
    expect(status.textContent).toBe("Original");
    expect(button.nextElementSibling).toBeNull();
  });

  it("reuses duplicate initialization for the same root", () => {
    const button = createButton();
    const first = createCopyButton(button, { value: "one" });
    const second = createCopyButton(button, { value: "two" });

    expect(second).toBe(first);
  });

  it("initializes all matching roots", () => {
    createButton("One");
    createButton("Two");

    const instances = initCopyButtonAll({ value: "shared" });

    expect(instances).toHaveLength(2);
    expect(instances.every((instance) => instance instanceof A11yCopyButton)).toBe(true);
  });

  it("copies a static value", async () => {
    const button = createButton();
    const instance = createCopyButton(button, { value: "https://example.com" });

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("https://example.com");
  });

  it("copies source text", async () => {
    const source = document.createElement("p");
    source.id = "source-text";
    source.textContent = "Readable caption";
    document.body.append(source);
    const button = createButton();
    const instance = createCopyButton(button, { sourceSelector: "#source-text" });

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("Readable caption");
  });

  it("re-queries a source selector that was missing during initialization", async () => {
    const button = createButton();
    button.setAttribute("data-a11y-copy-button-source-selector", "#late-source");
    const instance = createCopyButton(button);
    const source = document.createElement("p");
    source.id = "late-source";
    source.textContent = "Late caption";
    document.body.append(source);

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("Late caption");
  });

  it("re-queries a source selector after the cached source is removed", async () => {
    const source = document.createElement("p");
    source.id = "dynamic-source";
    source.textContent = "First caption";
    document.body.append(source);
    const button = createButton();
    button.setAttribute("data-a11y-copy-button-source-selector", "#dynamic-source");
    const instance = createCopyButton(button);

    await instance.copy();
    expect(writeText).toHaveBeenLastCalledWith("First caption");

    source.remove();
    const replacement = document.createElement("p");
    replacement.id = "dynamic-source";
    replacement.textContent = "Second caption";
    document.body.append(replacement);

    await instance.copy();

    expect(writeText).toHaveBeenLastCalledWith("Second caption");
  });

  it("copies a source attribute", async () => {
    const source = document.createElement("a");
    source.id = "source-link";
    source.setAttribute("href", "https://example.com/source");
    source.textContent = "Source";
    document.body.append(source);
    const button = createButton();
    const instance = createCopyButton(button, {
      sourceSelector: "#source-link",
      sourceAttribute: "href"
    });

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("https://example.com/source");
  });

  it("copies a custom getValue result", async () => {
    const button = createButton();
    const instance = createCopyButton(button, {
      copyMode: "custom",
      getValue: () => Promise.resolve("custom value")
    });

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("custom value");
  });

  it("keeps the newest result when an older value resolves later", async () => {
    const firstValue = deferred<string>();
    const button = createButton();
    const success = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.success, success);
    const instance = createCopyButton(button, { getValue: () => firstValue.promise });

    const first = instance.copy();
    await instance.copy("newer");
    firstValue.resolve("older");
    await first;

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("newer");
    expect(success).toHaveBeenCalledTimes(1);
    expect(button.nextElementSibling?.textContent).toBe("Copied");
  });

  it("keeps the newest status when an older write finishes later", async () => {
    const oldWrite = deferred<void>();
    writeText.mockImplementationOnce(() => oldWrite.promise);
    const button = createButton();
    const success = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.success, success);
    const instance = createCopyButton(button);

    const first = instance.copy("older");
    await waitForClick();
    await instance.copy("newer");
    oldWrite.resolve();
    await first;

    expect(success).toHaveBeenCalledTimes(1);
    expect(success.mock.calls[0]?.[0]).toMatchObject({ detail: { value: "newer" } });
    expect(button.nextElementSibling?.textContent).toBe("Copied");
  });

  it("does not announce an older rejected write after a newer success", async () => {
    const oldWrite = deferred<void>();
    writeText.mockImplementationOnce(() => oldWrite.promise);
    const button = createButton();
    const error = vi.fn();
    const onError = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.error, error);
    const instance = createCopyButton(button, { addons: [{ name: "observer", onError }] });

    const first = instance.copy("older");
    await waitForClick();
    await instance.copy("newer");
    const failure = new Error("Denied");
    oldWrite.reject(failure);
    await expect(first).rejects.toBe(failure);

    expect(error).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(button.nextElementSibling?.textContent).toBe("Copied");
  });

  it.each(["resolve", "write"] as const)("does not continue after destroy during %s", async (stage) => {
    const pending = deferred<string | void>();
    const button = createButton();
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]");
    const success = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.success, success);
    if (stage === "write") writeText.mockImplementationOnce(() => pending.promise as Promise<void>);
    const instance = createCopyButton(button, {
      getValue: stage === "resolve" ? () => pending.promise as Promise<string> : undefined,
      value: stage === "write" ? "value" : undefined
    });
    const copy = instance.copy();
    await waitForClick();
    instance.destroy();
    pending.resolve(stage === "resolve" ? "late" : undefined);
    await copy;

    expect(writeText).toHaveBeenCalledTimes(stage === "write" ? 1 : 0);
    expect(success).not.toHaveBeenCalled();
    expect(status?.textContent).toBe("");
    expect(button.getAttribute("aria-busy")).toBeNull();
  });

  it("keeps disabled feedback when a pending write finishes", async () => {
    const pending = deferred<void>();
    writeText.mockImplementationOnce(() => pending.promise);
    const button = createButton();
    const success = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.success, success);
    const instance = createCopyButton(button, { value: "value" });
    const copy = instance.copy();
    await waitForClick();
    instance.disable();
    pending.resolve();
    await copy;

    expect(button.disabled).toBe(true);
    expect(button.nextElementSibling?.textContent).toBe("Copy disabled");
    expect(success).not.toHaveBeenCalled();
  });

  it("keeps native button focus through an overlapping click", async () => {
    const pending = deferred<void>();
    writeText.mockImplementationOnce(() => pending.promise);
    const button = createButton();
    createCopyButton(button, { value: "first" });
    button.focus();

    button.click();
    await waitForClick();
    button.click();
    await waitForClick();
    pending.resolve();
    await waitForClick();

    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBeNull();
    expect(button.nextElementSibling?.textContent).toBe("Copied");
  });

  it("reports a rejected custom value through the error event and status", async () => {
    const button = createButton();
    const failure = new Error("Value unavailable");
    const error = vi.fn();
    const beforeCopy = vi.fn();
    const success = vi.fn();
    const onError = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.error, error);
    button.addEventListener(COPY_BUTTON_EVENTS.beforeCopy, beforeCopy);
    button.addEventListener(COPY_BUTTON_EVENTS.success, success);
    const instance = createCopyButton(button, {
      getValue: () => Promise.reject(failure),
      resetDelay: 50,
      addons: [{ name: "error observer", onError }]
    });

    await expect(instance.copy()).rejects.toBe(failure);

    expect(writeText).not.toHaveBeenCalled();
    expect(beforeCopy).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toMatchObject({
      detail: { instance, error: failure }
    });
    expect(button.nextElementSibling?.textContent).toBe("Copy failed");

    vi.advanceTimersByTime(50);
    expect(button.nextElementSibling?.textContent).toBe("");
  });

  it("dispatches success events with value detail", async () => {
    const button = createButton();
    const success = vi.fn();
    document.body.addEventListener(COPY_BUTTON_EVENTS.success, success);
    const instance = createCopyButton(button, { value: "event value" });

    await instance.copy();

    expect(success).toHaveBeenCalledTimes(1);
    expect(success.mock.calls[0]?.[0]).toMatchObject({
      detail: {
        instance,
        value: "event value",
        source: "option"
      }
    });
  });

  it("dispatches error events and rejects when clipboard writing fails", async () => {
    writeText.mockRejectedValueOnce(new Error("Denied"));
    const button = createButton();
    const error = vi.fn();
    document.body.addEventListener(COPY_BUTTON_EVENTS.error, error);
    const instance = createCopyButton(button, { value: "blocked" });

    await expect(instance.copy()).rejects.toThrow("Denied");

    expect(error).toHaveBeenCalledTimes(1);
    expect(button.nextElementSibling?.textContent).toBe("Copy failed");
  });

  it("updates status and resets after the configured delay", async () => {
    const button = createButton();
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]");
    const instance = createCopyButton(button, { value: "reset", resetDelay: 50 });

    await instance.copy();
    expect(status?.textContent).toBe("Copied");

    vi.advanceTimersByTime(50);

    expect(status?.textContent).toBe("");
  });

  it("trims boolean data options and ignores malformed reset delays", async () => {
    const button = createButton();
    button.setAttribute("data-a11y-copy-button-value", "");
    button.setAttribute("data-a11y-copy-button-allow-empty", " TRUE ");
    button.setAttribute("data-a11y-copy-button-reset-delay", "25ms");
    const status = button.querySelector<HTMLElement>("[data-a11y-copy-button-status]");
    const instance = createCopyButton(button);

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("");
    expect(status?.textContent).toBe("Copied");

    vi.advanceTimersByTime(25);
    expect(status?.textContent).toBe("Copied");

    vi.advanceTimersByTime(2175);
    expect(status?.textContent).toBe("");
  });

  it("uses native disabled state", async () => {
    const button = createButton();
    const instance = createCopyButton(button, { value: "disabled", disabled: true });

    expect(button.disabled).toBe(true);
    expect(button.classList.contains("is-disabled")).toBe(true);
    await expect(instance.copy()).rejects.toThrow("Copy disabled");

    instance.enable();
    expect(button.disabled).toBe(false);
  });

  it("supports localized messages", async () => {
    const button = createButton();
    const instance = createCopyButton(button, {
      value: "bonjour",
      locale: "fr",
      messages: {
        copied: "Copie"
      }
    });

    await instance.copy();

    expect(button.nextElementSibling?.textContent).toBe("Copie");
    expect(instance.t("copied")).toBe("Copie");
  });

  it("registers and unregisters addons", () => {
    const button = createButton();
    const instance = createCopyButton(button, { value: "addon" });
    const addon: CopyButtonAddon = { name: "analytics" };

    instance.registerAddon(addon);
    expect(instance.getAddon("analytics")).toEqual(addon);
    expect(instance.getAddons()).toHaveLength(1);

    instance.unregisterAddon("analytics");
    expect(instance.getAddon("analytics")).toBeUndefined();
  });

  it("normalizes initial addon names and lets later duplicates replace earlier ones", async () => {
    const firstBeforeCopy = vi.fn();
    const secondBeforeCopy = vi.fn();
    const button = createButton();
    const instance = createCopyButton(button, {
      value: "addon",
      addons: [
        { name: " analytics ", beforeCopy: firstBeforeCopy },
        { name: "analytics", beforeCopy: secondBeforeCopy }
      ]
    });

    expect(instance.getAddons()).toHaveLength(1);
    expect(instance.getAddon("analytics")?.name).toBe("analytics");

    await instance.copy();

    expect(firstBeforeCopy).not.toHaveBeenCalled();
    expect(secondBeforeCopy).toHaveBeenCalledTimes(1);
  });

  it("rejects initial addons with empty names", () => {
    const button = createButton();

    expect(() =>
      createCopyButton(button, {
        addons: [{ name: "   " }]
      })
    ).toThrow("Copy button addons require a non-empty name.");
  });

  it("isolates addon errors and reports them", async () => {
    const button = createButton();
    const addonError = vi.fn();
    document.body.addEventListener(COPY_BUTTON_EVENTS.addonError, addonError);
    const instance = createCopyButton(button, {
      value: "still copies",
      addons: [
        {
          name: "broken",
          beforeCopy: () => {
            throw new Error("Addon failed");
          }
        }
      ]
    });

    await instance.copy();

    expect(writeText).toHaveBeenCalledWith("still copies");
    expect(addonError).toHaveBeenCalledTimes(1);
  });

  it("cleans up listeners, classes, timers, and generated status on destroy", async () => {
    const button = document.createElement("button");
    button.setAttribute("data-a11y-copy-button", "");
    button.textContent = "Copy";
    document.body.append(button);
    const instance = createCopyButton(button, { value: "destroy" });
    const generatedStatus = document.querySelector("[data-a11y-copy-button-status]");

    await instance.copy();
    instance.destroy();
    button.click();
    await waitForClick();

    expect(button.classList.contains("is-initialized")).toBe(false);
    expect(generatedStatus?.isConnected).toBe(false);
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("dispatches bubbling lifecycle events", () => {
    const events: string[] = [];
    const button = createButton();

    document.body.addEventListener(COPY_BUTTON_EVENTS.init, () => events.push("init"));
    document.body.addEventListener(COPY_BUTTON_EVENTS.ready, () => events.push("ready"));
    document.body.addEventListener(COPY_BUTTON_EVENTS.destroy, () => events.push("destroy"));

    const instance = createCopyButton(button, { value: "life" });
    instance.destroy();

    expect(events).toEqual(["init", "ready", "destroy"]);
  });

  it("uses the fallback copy path only when opted in", async () => {
    setClipboard(undefined);
    const execCommand = vi.fn(() => true);
    const onSuccess = vi.fn();
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand
    });
    const button = createButton();
    const instance = createCopyButton(button, {
      value: "fallback",
      fallbackCopy: true,
      addons: [{ name: "result observer", onSuccess }]
    });

    await instance.copy();

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(button.nextElementSibling?.textContent).toBe("Copied");
  });

  it("rejects empty values unless allowEmpty is true", async () => {
    const blockedButton = createButton("Blocked");
    const blocked = createCopyButton(blockedButton, { value: "" });

    await expect(blocked.copy()).rejects.toThrow("Copy unavailable");
    expect(writeText).not.toHaveBeenCalled();

    const allowedButton = createButton("Allowed");
    const allowed = createCopyButton(allowedButton, { value: "", allowEmpty: true });

    await allowed.copy();

    expect(writeText).toHaveBeenCalledWith("");
  });

  it("can be activated by native button click", async () => {
    const button = createButton();
    createCopyButton(button, { value: "clicked" });

    button.click();
    await waitForClick();

    expect(writeText).toHaveBeenCalledWith("clicked");
  });

  it("reports a failed click without an unhandled rejection", async () => {
    const button = createButton();
    createCopyButton(button, { value: "" });

    button.click();
    await waitForClick();

    expect(button.nextElementSibling?.textContent).toBe("Copy failed");
  });

  it("reports a rejected custom value from a click with its trigger", async () => {
    const button = createButton();
    const failure = new Error("Value unavailable");
    const error = vi.fn();
    button.addEventListener(COPY_BUTTON_EVENTS.error, error);
    createCopyButton(button, { getValue: () => Promise.reject(failure) });

    button.click();
    await waitForClick();

    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0]?.[0]).toMatchObject({
      detail: { error: failure, trigger: expect.objectContaining({ type: "click" }) }
    });
    expect(button.nextElementSibling?.textContent).toBe("Copy failed");
    expect(writeText).not.toHaveBeenCalled();
  });
});
