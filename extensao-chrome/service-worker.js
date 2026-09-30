"use strict";

// O Chrome ancora e alterna o painel. Não se criam janelas nem elementos na página.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    chrome.action.setTitle({ title: "Recarregue a extensão para abrir o painel lateral." }).catch(() => {});
});

// Limpa também o contexto eventualmente mantido em cache pelo Chrome ao fechar.
chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    chrome.runtime.sendMessage({ type: "gasometria:panel-closed", windowId }).catch(() => {});
});
