"use strict";

// A extensão usa o painel lateral nativo do Chrome (mesmo modelo da gasometria).
// Ao clicar no ícone da barra de ferramentas, o painel abre com braden.html.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    chrome.action.setTitle({ title: "Recarregue a extensão para abrir o painel lateral." }).catch(() => { });
});

chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    chrome.runtime.sendMessage({ type: "braden:panel-closed", windowId }).catch(() => { });
});