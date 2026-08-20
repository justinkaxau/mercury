import { pathToRoot } from "../../util/path"
import { PageFrame, PageFrameProps } from "./types"

/**
 * Reading-focused frame for article pages.
 *
 * Navigation and contextual tools remain available in native disclosure
 * panels, while the article itself gets a calm, centered reading column.
 */
export const ReadingFrame: PageFrame = {
  name: "reading",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer,
  }: PageFrameProps) {
    const home = pathToRoot(componentData.fileData.slug!)

    return (
      <>
        <nav class="reading-bar" aria-label="Điều hướng chính">
          <a class="reading-brand" href={home}>
            {componentData.cfg.pageTitle}
          </a>
          <div class="reading-actions">
            <details class="reading-disclosure" name="reading-panel">
              <summary aria-label="Mở tìm kiếm và điều hướng" title="Tìm kiếm và điều hướng">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <span>Tìm kiếm</span>
              </summary>
              <aside class="sidebar left reading-panel reading-panel-left">
                {left.map((BodyComponent) => (
                  <BodyComponent {...componentData} />
                ))}
              </aside>
            </details>

            <details class="reading-disclosure" name="reading-panel">
              <summary aria-label="Mở mục lục và công cụ" title="Mục lục và công cụ">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6h11M9 12h11M9 18h11" />
                  <circle cx="4" cy="6" r="1" />
                  <circle cx="4" cy="12" r="1" />
                  <circle cx="4" cy="18" r="1" />
                </svg>
                <span>Mục lục</span>
              </summary>
              <aside class="sidebar right reading-panel reading-panel-right">
                {right.map((BodyComponent) => (
                  <BodyComponent {...componentData} />
                ))}
              </aside>
            </details>
          </div>
        </nav>

        <main class="center reading-center">
          <div class="page-header reading-page-header">
            {header.length > 0 && (
              <header>
                {header.map((HeaderComponent) => (
                  <HeaderComponent {...componentData} />
                ))}
              </header>
            )}
            <div class="popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
          </div>
          <div class="reading-prose">
            <Content {...componentData} />
          </div>
          <hr />
          <div class="page-footer reading-after-body">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </main>

        {footer.map((FooterComponent) => (
          <FooterComponent {...componentData} />
        ))}
      </>
    )
  },
  css: `
.page[data-frame="reading"] > #quartz-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "reading-bar"
    "grid-center"
    "grid-footer";
  width: 100%;
  max-width: none;
  min-height: 100vh;
  padding: 0;
}

.page[data-frame="reading"] .reading-bar {
  grid-area: reading-bar;
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 4rem;
  box-sizing: border-box;
  padding: 0.75rem clamp(1rem, 4vw, 4rem);
  border-bottom: 1px solid var(--lightgray);
  background: color-mix(in srgb, var(--light) 92%, transparent);
  backdrop-filter: blur(14px);
}

.page[data-frame="reading"] .reading-brand {
  color: var(--dark);
  font-family: var(--headerFont);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
}

.page[data-frame="reading"] .reading-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page[data-frame="reading"] .reading-disclosure > summary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  box-sizing: border-box;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  color: var(--darkgray);
  background: var(--light);
  cursor: pointer;
  font-size: 0.85rem;
  list-style: none;
}

.page[data-frame="reading"] .reading-disclosure > summary::-webkit-details-marker {
  display: none;
}

.page[data-frame="reading"] .reading-disclosure > summary:hover,
.page[data-frame="reading"] .reading-disclosure[open] > summary {
  color: var(--dark);
  border-color: var(--gray);
}

.page[data-frame="reading"] .reading-disclosure > summary svg {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.page[data-frame="reading"] .reading-panel {
  position: fixed;
  top: 4.25rem;
  bottom: 0.75rem;
  z-index: 30;
  display: flex;
  width: min(24rem, calc(100vw - 1.5rem));
  height: auto;
  box-sizing: border-box;
  padding: 1.25rem;
  overflow-y: auto;
  border: 1px solid var(--lightgray);
  border-radius: 1rem;
  background: var(--light);
  box-shadow: 0 18px 60px rgb(0 0 0 / 18%);
}

.page[data-frame="reading"] .reading-panel-left {
  left: 0.75rem;
}

.page[data-frame="reading"] .reading-panel-right {
  right: 0.75rem;
}

.page[data-frame="reading"] .reading-panel .page-title {
  display: none;
}

.page[data-frame="reading"] .reading-center {
  grid-area: grid-center;
  width: 100%;
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  margin: 0;
  padding: clamp(2rem, 5vw, 5rem) clamp(1.25rem, 4vw, 4rem);
}

.page[data-frame="reading"] .reading-page-header {
  width: min(100%, 1100px);
  margin-inline: auto;
}

.page[data-frame="reading"] .reading-prose,
.page[data-frame="reading"] .reading-after-body,
.page[data-frame="reading"] .reading-center > hr {
  width: min(100%, 920px);
  margin-inline: auto;
}

.page[data-frame="reading"] .reading-prose article > :is(
  .table-container,
  table,
  pre,
  figure,
  .mermaid,
  p:has(> img:only-child)
) {
  width: min(1200px, calc(100vw - 3rem));
  max-width: none;
  margin-left: 50%;
  transform: translateX(-50%);
}

.page[data-frame="reading"] .reading-prose article img {
  max-width: 100%;
  height: auto;
}

.page[data-frame="reading"] > #quartz-body > footer {
  grid-area: grid-footer;
  width: min(100%, 920px);
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

@media all and (max-width: 800px) {
  .page[data-frame="reading"] .reading-bar {
    min-height: 3.5rem;
    padding: 0.65rem 1rem;
  }

  .page[data-frame="reading"] .reading-disclosure > summary span {
    display: none;
  }

  .page[data-frame="reading"] .reading-disclosure > summary {
    justify-content: center;
    width: 2.25rem;
    padding: 0;
  }

  .page[data-frame="reading"] .reading-panel {
    top: 3.75rem;
  }

  .page[data-frame="reading"] .reading-center {
    padding: 2rem 1.25rem;
  }

  .page[data-frame="reading"] .reading-prose article > :is(
    .table-container,
    table,
    pre,
    figure,
    .mermaid,
    p:has(> img:only-child)
  ) {
    width: 100%;
    margin-left: 0;
    transform: none;
  }
}
`,
}
