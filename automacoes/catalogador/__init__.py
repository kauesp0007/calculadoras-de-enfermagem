"""Catalogador Inteligente de PDFs — Calculadoras de Enfermagem.

Sistema profissional de catalogação, classificação e renomeação automática
de documentos PDF utilizando Python, PyMuPDF, Tesseract OCR e API DeepSeek.

Módulos:
    config:     Configurações centralizadas e constantes
    utils:      Funções utilitárias (normalização, sanitização)
    logger:     Sistema de logging com 3 arquivos
    database:   SQLite — schema, CRUD, migrações
    hash_manager: SHA-256, detecção de duplicatas/versões
    pdf_reader: Extração de metadados e texto (PyMuPDF/pdfplumber)
    ocr_engine: OCR via Tesseract para PDFs digitalizados
    snippet_builder: Constrói trechos para envio à IA
    cache_manager: Cache em disco para reduzir chamadas à API
    deepseek_client: Cliente da API DeepSeek via OpenAI SDK
    classifier: Parse e validação da resposta da IA
    rename_engine: Normalização SEO e geração de novo nome
    output_generator: Renomeação, JSON, CSV, atualização do DB
    watcher: Monitoramento contínuo da pasta docs/
    tui: Interface de terminal profissional (Rich)
    main: Ponto de entrada e orquestrador do pipeline
"""

__version__ = "1.0.0"
__author__ = "Calculadoras de Enfermagem"
