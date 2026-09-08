import mediumZoom from "medium-zoom"

function setupZoom() {
  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>("article img:not(a img):not(.no-zoom)"),
  )

  if (images.length === 0) return

  const zoom = mediumZoom(images, {
    margin: 24,
    background: "var(--light)",
  })

  window.addCleanup(() => {
    zoom.detach()
  })
}

document.addEventListener("nav", setupZoom)
document.addEventListener("render", setupZoom)
