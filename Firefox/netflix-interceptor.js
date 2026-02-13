(function() {
  function patchAkiraClient(code) {
    return code
      .replace(
        /\.showPlayerInterstitial\s*=\s*!0/g,
        ".showPlayerInterstitial=!1"
      )
      .replace(
        /\.showPlayerInterstitial\s*=\s*true/g,
        ".showPlayerInterstitial=false"
      );
  }

  function injectPatchedScript(url, origNode) {
    fetch(url).then(function(r) { return r.text(); }).then(function(code) {
      var patched = patchAkiraClient(code);
      var s = document.createElement("script");
      s.textContent = patched;
      if (origNode && origNode.parentNode) {
        origNode.parentNode.insertBefore(s, origNode);
        origNode.parentNode.removeChild(origNode);
      } else {
        (document.head || document.documentElement).appendChild(s);
      }
    });
  }

  if ("onbeforescriptexecute" in document) {
    document.addEventListener("beforescriptexecute", function(e) {
      if (e.target.src && e.target.src.indexOf("akiraClient") !== -1) {
        e.preventDefault();
        injectPatchedScript(e.target.src, e.target);
      }
    }, true);
  } else {
    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        for (var j = 0; j < mutations[i].addedNodes.length; j++) {
          var node = mutations[i].addedNodes[j];
          if (node.tagName === "SCRIPT" && node.src && node.src.indexOf("akiraClient") !== -1) {
            var url = node.src;
            node.type = "javascript/blocked";
            injectPatchedScript(url, node);
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
