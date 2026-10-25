// index.svg is an XML document, not an HTML one. Third-party code (the
// Firebase SDK in particular) assumes HTML: it calls document.createElement()
// for <script>/<iframe> tags and appends them to document.head / body.
// In an SVG document those elements would land in the null namespace and do
// nothing, so this shim routes them into the XHTML namespace instead.
(function () {
  var XHTML = "http://www.w3.org/1999/xhtml";
  if (document.contentType === "text/html") return;

  var createElement = Document.prototype.createElement;
  Document.prototype.createElement = function (tagName, options) {
    if (
      this.contentType !== "text/html" &&
      this.contentType !== "application/xhtml+xml"
    ) {
      return this.createElementNS(
        XHTML,
        String(tagName).toLowerCase(),
        options,
      );
    }
    return createElement.call(this, tagName, options);
  };

  function byId(id) {
    return function () {
      return document.getElementById(id);
    };
  }

  try {
    Object.defineProperty(document, "head", {
      configurable: true,
      get: byId("head"),
    });
    Object.defineProperty(document, "body", {
      configurable: true,
      get: byId("root"),
    });
  } catch (err) {
    console.warn("Sipher shim: could not patch document.head/body", err);
  }
})();
