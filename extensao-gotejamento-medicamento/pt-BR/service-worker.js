"use strict";

// Extensão anônima em relação à página aberta: usa apenas o painel lateral
// nativo do Chrome. Sem host_permissions, sem content scripts, sem storage e
// sem acesso a abas — a página não consegue detectar a presença da extensão.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    chrome.action.setTitle({ title: "Recarregue a extensão para abrir o painel lateral." }).catch(() => { });
});

chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    chrome.runtime.sendMessage({ type: "gotejamento:panel-closed", windowId }).catch(() => { });
});
