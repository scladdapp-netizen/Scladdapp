import Image from "@tiptap/extension-image";

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") || "center",
        renderHTML: (attrs) => (attrs.align ? { "data-align": attrs.align } : {}),
      },
    };
  },
});

export default ResizableImage;
