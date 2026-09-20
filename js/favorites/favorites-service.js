/**
 * Favorites persistence: Supabase PostgreSQL via account-data.
 * Historical API preserved for compatibility.
 */
(function(window){
  "use strict";
  window.FavoritesModules=window.FavoritesModules||{};
  async function call(method,body,query){return window.AuthModules.accountData.request(method,"favorites",body,query);}
  async function listFavorites(uid){if(!uid)return[];var d=await call("GET");return d.items||[];}
  async function getFavorite(uid,pageId){if(!uid||!pageId)return null;var items=await listFavorites(uid);return items.find(function(x){return x.pageId===pageId||x.id===pageId;})||null;}
  async function addFavorite(uid,favorite){if(!uid||!favorite||!favorite.pageId)throw new Error("[FavoritesService] pageId é obrigatório.");var d=await call("POST",favorite);return d.item||favorite;}
  async function removeFavorite(uid,pageId){if(!uid||!pageId)return;await call("DELETE",{pageId:pageId});}
  window.FavoritesModules.service={listFavorites:listFavorites,getFavorite:getFavorite,addFavorite:addFavorite,removeFavorite:removeFavorite,serverTimestamp:function(){return new Date();}};
  console.log("[Favorites] Persistência centralizada no Supabase.");
})(window);