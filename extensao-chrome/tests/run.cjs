"use strict";
(async () => {
    const clinical = require("./core.test.cjs")();
    const runtime = await require("./runtime.test.cjs")();
    const structure = require("./structure.test.cjs")();
    console.log("PASS: " + (clinical + runtime + structure) + " verificações (" +
        clinical + " clínicas, " + runtime + " de execução simulada e " + structure + " estruturais).");
    console.log("A conferência visual e a integração real no Chrome continuam necessárias.");
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
