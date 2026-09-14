(function (window) {
  "use strict";

  if (!window || !window.fetch) return;
  if (window.__forumModerationFirebaseBridge) return;
  window.__forumModerationFirebaseBridge = true;

  var nativeFetch = window.fetch.bind(window);
  var ENDPOINT = "/functions/v1/forum-moderation";

  function isModerationRequest(input) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    return url.indexOf(ENDPOINT) !== -1;
  }

  function getCurrentUser() {
    try {
      if (window.Auth && typeof window.Auth.currentUser === "function") {
        var user = window.Auth.currentUser();
        if (user) return user;
      }
    } catch (_) {}
    try {
      if (window.firebase && typeof window.firebase.auth === "function") {
        return window.firebase.auth().currentUser || null;
      }
    } catch (_) {}
    return null;
  }

  window.fetch = async function (input, init) {
    if (!isModerationRequest(input)) return nativeFetch(input, init);

    var user = getCurrentUser();
    if (!user || typeof user.getIdToken !== "function") {
      return nativeFetch(input, init);
    }

    try {
      var token = await user.getIdToken();
      if (!token) return nativeFetch(input, init);

      var headers;
      if (init && init.headers) headers = new Headers(init.headers);
      else if (typeof Request !== "undefined" && input instanceof Request) headers = new Headers(input.headers);
      else headers = new Headers();
      headers.set("Authorization", "Bearer " + token);

      if (init) {
        var nextInit = Object.assign({}, init, { headers: headers });
        return nativeFetch(input, nextInit);
      }
      if (typeof Request !== "undefined" && input instanceof Request) {
        return nativeFetch(new Request(input, { headers: headers }));
      }
      return nativeFetch(input, { headers: headers });
    } catch (_) {
      return nativeFetch(input, init);
    }
  };
})(window);
