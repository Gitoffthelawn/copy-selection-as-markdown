export const resolveRelativeUrls = (container, baseUrl) => {
  // Resolve relative links
  for (const a of container.getElementsByTagName("a")) {
    if (a.hasAttribute("href") && !a.getAttribute("href").startsWith("http")) {
      a.setAttribute("href", new URL(a.getAttribute("href"), baseUrl).href);
    }
  }

  // Resolve relative image sources
  for (const img of container.getElementsByTagName("img")) {
    if (
      img.hasAttribute("src") &&
      !img.getAttribute("src").startsWith("http")
    ) {
      img.setAttribute("src", new URL(img.getAttribute("src"), baseUrl).href);
    }
  }
};

export const imgToDataUrl = (image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.setAttribute("crossorigin", "anonymous");
    img.onload = function () {
      let canvas = document.createElement("canvas");
      canvas.width = this.naturalWidth;
      canvas.height = this.naturalHeight;

      canvas.getContext("2d").drawImage(this, 0, 0);
      image.setAttribute("src", canvas.toDataURL("image/png"));

      resolve(image.src);
      canvas = null;
    };

    img.src = image.getAttribute("src");
  });
};
