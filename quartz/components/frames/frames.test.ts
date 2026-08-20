import test, { describe } from "node:test"
import assert from "node:assert"
import { h } from "preact"
import renderToString from "preact-render-to-string"
import { resolveFrame, frameRegistry } from "./index"
import { DefaultFrame } from "./DefaultFrame"
import { FullWidthFrame } from "./FullWidthFrame"
import { ReadingFrame } from "./ReadingFrame"
import type { PageFrame } from "./types"

const customFrame: PageFrame = {
  name: "custom-test-frame",
  render: () => null as any,
}

describe("resolveFrame", () => {
  test("returns DefaultFrame for undefined", () => {
    assert.strictEqual(resolveFrame(undefined), DefaultFrame)
  })

  test("returns DefaultFrame for 'default'", () => {
    assert.strictEqual(resolveFrame("default"), DefaultFrame)
  })

  test("returns named built-in frame", () => {
    assert.strictEqual(resolveFrame("full-width"), FullWidthFrame)
    assert.strictEqual(resolveFrame("reading"), ReadingFrame)
  })

  test("returns DefaultFrame for unknown frame name", () => {
    assert.strictEqual(resolveFrame("nonexistent"), DefaultFrame)
  })

  test("plugin-registered frame takes priority", () => {
    frameRegistry.register("custom-test-frame", customFrame, "test-plugin")
    const result = resolveFrame("custom-test-frame")
    assert.strictEqual(result, customFrame)
  })

  test("returns DefaultFrame for unknown name even with plugin frames registered", () => {
    frameRegistry.register("custom-test-frame", customFrame, "test-plugin")
    const result = resolveFrame("totally-unknown")
    assert.strictEqual(result, DefaultFrame)
  })
})

describe("ReadingFrame", () => {
  test("renders the reading bar, both tool panels, and article content", () => {
    const Empty = () => null
    const Content = () => h("article", null, "Nội dung kiểm tra")
    const LeftTool = () => h("div", { class: "left-tool" }, "Tìm kiếm")
    const RightTool = () => h("div", { class: "right-tool" }, "Mục lục")

    const html = renderToString(
      ReadingFrame.render({
        componentData: {
          fileData: { slug: "bai-viet" },
          cfg: { pageTitle: "Mercury" },
        } as any,
        head: Empty,
        header: [],
        beforeBody: [],
        pageBody: Content,
        afterBody: [],
        left: [LeftTool],
        right: [RightTool],
        footer: [],
      }),
    )

    assert.match(html, /class="reading-bar"/)
    assert.match(html, />Mercury<\/a>/)
    assert.match(html, /class="left-tool">Tìm kiếm/)
    assert.match(html, /class="right-tool">Mục lục/)
    assert.match(html, /<article>Nội dung kiểm tra<\/article>/)
  })
})
