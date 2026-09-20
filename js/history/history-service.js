/**
 * History persistence: Supabase PostgreSQL via account-data.
 * Historical API preserved for compatibility.
 */
(function(window){
  "use strict";
  window.HistoryModules=window.HistoryModules||{};
  async function call(method,body,query){return window.AuthModules.accountData.request(method,"history",body,query);}
  async function addVisit(uid,data){if(!uid||!data)throw new Error("[HistoryService] uid e dados são obrigatórios.");var d=await call("POST",data);return d.id;}
  async function updateVisit(uid,id,data){if(!uid||!id||!data)return;await call("PATCH",data,{id:id});}
  async function listHistory(uid,limit){if(!uid)return[];var d=await call("GET",undefined,{limit:String(limit||1000)});return d.items||[];}
  async function deleteVisit(uid,id){if(!uid||!id)return;await call("DELETE",undefined,{id:id});}
  async function clearHistory(uid){if(!uid)return;await call("DELETE");}
  window.HistoryModules.service={addVisit:addVisit,updateVisit:updateVisit,listHistory:listHistory,deleteVisit:deleteVisit,clearHistory:clearHistory,serverTimestamp:function(){return new Date();}};
  console.log("[History] Persistência centralizada no Supabase.");
})(window);