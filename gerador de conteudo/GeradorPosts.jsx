import React, { useState } from 'react';
import { todasFerramentas } from '../data/calculadoras';
import PostIndividual from './PostIndividual';
import { Download, Instagram, Linkedin, Grid, List, Filter } from 'lucide-react';

const GeradorPosts = () => {
  const [formatoSelecionado, setFormatoSelecionado] = useState('instagram');
  const [visualizacao, setVisualizacao] = useState('grid');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [postAtual, setPostAtual] = useState(0);

  const ferramentasFiltradas = todasFerramentas.filter(ferramenta => 
    filtroCategoria === 'Todas' || ferramenta.categoria === filtroCategoria
  );

  const exportarPost = (ferramenta, formato) => {
    // Função para exportar o post como imagem (implementação futura)
    console.log(`Exportando ${ferramenta.nome} como ${formato}`);
  };

  const exportarTodos = () => {
    // Função para exportar todos os posts (implementação futura)
    console.log(`Exportando todos os ${ferramentasFiltradas.length} posts como ${formatoSelecionado}`);
  };

  const VisualizacaoGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {ferramentasFiltradas.map((ferramenta, index) => (
        <div key={ferramenta.id} className="relative group">
          <PostIndividual ferramenta={ferramenta} formato={formatoSelecionado} />
          
          {/* Overlay com ações */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={() => exportarPost(ferramenta, formatoSelecionado)}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
          
          {/* Número do post */}
          <div className="absolute top-2 left-2 bg-primary-color text-white px-2 py-1 rounded-lg text-xs font-bold">
            #{index + 1}
          </div>
        </div>
      ))}
    </div>
  );

  const VisualizacaoLista = () => (
    <div className="space-y-8">
      {ferramentasFiltradas.map((ferramenta, index) => (
        <div key={ferramenta.id} className="flex items-center gap-6 bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex-shrink-0">
            <div className="bg-primary-color text-white px-3 py-2 rounded-lg text-sm font-bold">
              #{index + 1}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-nunito font-bold text-lg primary-color mb-2">
              {ferramenta.nome}
            </h3>
            <p className="font-inter text-gray-600 mb-2">
              {ferramenta.descricao}
            </p>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {ferramenta.categoria}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {ferramenta.aplicacao}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={() => exportarPost(ferramenta, formatoSelecionado)}
              className="bg-primary-color text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const VisualizacaoCarrossel = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="font-nunito font-bold text-xl primary-color">
            Post {postAtual + 1} de {ferramentasFiltradas.length}
          </h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {ferramentasFiltradas[postAtual]?.nome}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setPostAtual(Math.max(0, postAtual - 1))}
            disabled={postAtual === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => setPostAtual(Math.min(ferramentasFiltradas.length - 1, postAtual + 1))}
            disabled={postAtual === ferramentasFiltradas.length - 1}
            className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      </div>
      
      <div className="flex justify-center">
        <PostIndividual ferramenta={ferramentasFiltradas[postAtual]} formato={formatoSelecionado} />
      </div>
      
      <div className="flex justify-center mt-6">
        <button
          onClick={() => exportarPost(ferramentasFiltradas[postAtual], formatoSelecionado)}
          className="bg-primary-color text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Exportar Post Atual
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-bg py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-nunito font-bold text-gradient mb-2">
            Gerador de Posts para Redes Sociais
          </h1>
          <p className="font-inter text-gray-600">
            Crie posts profissionais para Instagram e LinkedIn com todas as {todasFerramentas.length} ferramentas
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Formato */}
            <div>
              <label className="block font-nunito font-semibold text-sm primary-color mb-2">
                Formato
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormatoSelecionado('instagram')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formatoSelecionado === 'instagram'
                      ? 'bg-pink-100 text-pink-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </button>
                <button
                  onClick={() => setFormatoSelecionado('linkedin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formatoSelecionado === 'linkedin'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </button>
              </div>
            </div>

            {/* Visualização */}
            <div>
              <label className="block font-nunito font-semibold text-sm primary-color mb-2">
                Visualização
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisualizacao('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    visualizacao === 'grid'
                      ? 'bg-primary-color text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Grade
                </button>
                <button
                  onClick={() => setVisualizacao('lista')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    visualizacao === 'lista'
                      ? 'bg-primary-color text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Lista
                </button>
              </div>
            </div>

            {/* Filtro */}
            <div>
              <label className="block font-nunito font-semibold text-sm primary-color mb-2">
                Categoria
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg font-inter text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas">Todas ({todasFerramentas.length})</option>
                <option value="Calculadoras">Calculadoras (10)</option>
                <option value="Escalas">Escalas (41)</option>
              </select>
            </div>

            {/* Exportar */}
            <div>
              <label className="block font-nunito font-semibold text-sm primary-color mb-2">
                Exportar
              </label>
              <button
                onClick={exportarTodos}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Todos ({ferramentasFiltradas.length})
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {ferramentasFiltradas.length}
            </div>
            <div className="font-inter text-sm text-gray-600">Posts Disponíveis</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {formatoSelecionado === 'instagram' ? '1:1' : '1.91:1'}
            </div>
            <div className="font-inter text-sm text-gray-600">Proporção</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {formatoSelecionado === 'instagram' ? 'Instagram' : 'LinkedIn'}
            </div>
            <div className="font-inter text-sm text-gray-600">Plataforma</div>
          </div>
        </div>

        {/* Conteúdo */}
        {visualizacao === 'grid' && <VisualizacaoGrid />}
        {visualizacao === 'lista' && <VisualizacaoLista />}
        {visualizacao === 'carrossel' && <VisualizacaoCarrossel />}
      </div>
    </div>
  );
};

export default GeradorPosts;

