import React, { useState } from 'react';
import './App.css';
import { todasFerramentas, calculadoras, escalas } from './data/calculadoras';
import logo from './assets/logo.png';
import { ChevronLeft, ChevronRight, Search, Filter, Heart, Calculator, Scale, Grid, Home } from 'lucide-react';
import GeradorPosts from './components/GeradorPosts';

function App() {
  const [paginaAtual, setPaginaAtual] = useState('home');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState(null);

  const ferramentasFiltradas = todasFerramentas.filter(ferramenta => {
    const matchCategoria = filtroCategoria === 'Todas' || ferramenta.categoria === filtroCategoria;
    const matchBusca = ferramenta.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
                      ferramenta.descricao.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const CarrosselFerramentas = ({ ferramentas, titulo, icone: IconeCategoria }) => {
    const [indiceAtual, setIndiceAtual] = useState(0);
    const itensPorPagina = 4;
    const totalPaginas = Math.ceil(ferramentas.length / itensPorPagina);

    const proximaPagina = () => {
      setIndiceAtual((prev) => (prev + 1) % totalPaginas);
    };

    const paginaAnterior = () => {
      setIndiceAtual((prev) => (prev - 1 + totalPaginas) % totalPaginas);
    };

    const ferramentasVisiveis = ferramentas.slice(
      indiceAtual * itensPorPagina,
      (indiceAtual + 1) * itensPorPagina
    );

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-color rounded-xl">
              <IconeCategoria className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-nunito font-bold text-gradient">{titulo}</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {ferramentas.length} itens
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={paginaAnterior}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              disabled={totalPaginas <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={proximaPagina}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              disabled={totalPaginas <= 1}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ferramentasVisiveis.map((ferramenta) => (
            <div
              key={ferramenta.id}
              className="post-card card-hover"
              onClick={() => setFerramentaSelecionada(ferramenta)}
            >
              <div className="icon-container">
                <img 
                  src={ferramenta.icone} 
                  alt={ferramenta.nome}
                  className="w-12 h-12"
                />
              </div>
              <h3 className="font-nunito font-semibold text-lg primary-color mb-2 text-center">
                {ferramenta.nome}
              </h3>
              <p className="font-inter text-sm text-gray-600 text-center mb-3 line-clamp-3">
                {ferramenta.descricao}
              </p>
              <div className="text-center">
                <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {ferramenta.aplicacao}
                </span>
              </div>
            </div>
          ))}
        </div>

        {totalPaginas > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i}
                onClick={() => setIndiceAtual(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === indiceAtual ? 'bg-primary-color' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ModalDetalhes = ({ ferramenta, onClose }) => {
    if (!ferramenta) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="icon-container">
                  <img 
                    src={ferramenta.icone} 
                    alt={ferramenta.nome}
                    className="w-12 h-12"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-nunito font-bold primary-color">
                    {ferramenta.nome}
                  </h2>
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
                    {ferramenta.categoria}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-nunito font-semibold text-lg primary-color mb-2">
                  Descrição
                </h3>
                <p className="font-inter text-gray-700">
                  {ferramenta.descricao}
                </p>
              </div>

              <div>
                <h3 className="font-nunito font-semibold text-lg primary-color mb-2">
                  Aplicação Clínica
                </h3>
                <p className="font-inter text-gray-700">
                  {ferramenta.aplicacao}
                </p>
              </div>

              <div>
                <h3 className="font-nunito font-semibold text-lg primary-color mb-2">
                  Importância
                </h3>
                <p className="font-inter text-gray-700">
                  {ferramenta.importancia}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-inter text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Esta ferramenta é essencial para profissionais de enfermagem 
                  que atuam em {ferramenta.aplicacao.toLowerCase()}. Mantenha sempre atualizado 
                  seu conhecimento sobre sua aplicação prática.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Calculadoras de Enfermagem" className="h-12" />
              <div>
                <h1 className="text-2xl font-nunito font-bold text-gradient">
                  Calculadoras de Enfermagem
                </h1>
                <p className="font-inter text-sm text-gray-600">
                  Ferramentas essenciais para profissionais e estudantes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  paginaAtual === 'home' 
                    ? 'bg-primary-color text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="font-inter text-sm">Início</span>
              </button>
              <button
                onClick={() => setPaginaAtual('posts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  paginaAtual === 'posts' 
                    ? 'bg-primary-color text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="font-inter text-sm">Posts</span>
              </button>
              <Heart className="w-5 h-5 text-red-500 ml-2" />
              <span className="font-inter text-sm text-gray-600">
                Cuidando com precisão
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo da página */}
      {paginaAtual === 'home' && (
        <>
          {/* Filtros e Busca */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar calculadoras e escalas..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg font-inter focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {['Todas', 'Calculadoras', 'Escalas'].map((categoria) => (
                    <button
                      key={categoria}
                      onClick={() => setFiltroCategoria(categoria)}
                      className={`px-4 py-3 rounded-lg font-inter font-medium transition-colors ${
                        filtroCategoria === categoria
                          ? 'bg-primary-color text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {categoria}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultados da busca */}
            {termoBusca && (
              <div className="mb-8">
                <h2 className="text-xl font-nunito font-bold primary-color mb-4">
                  Resultados da busca "{termoBusca}" ({ferramentasFiltradas.length} encontrados)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {ferramentasFiltradas.map((ferramenta) => (
                    <div
                      key={ferramenta.id}
                      className="post-card card-hover"
                      onClick={() => setFerramentaSelecionada(ferramenta)}
                    >
                      <div className="icon-container">
                        <img 
                          src={ferramenta.icone} 
                          alt={ferramenta.nome}
                          className="w-12 h-12"
                        />
                      </div>
                      <h3 className="font-nunito font-semibold text-lg primary-color mb-2 text-center">
                        {ferramenta.nome}
                      </h3>
                      <p className="font-inter text-sm text-gray-600 text-center mb-3 line-clamp-3">
                        {ferramenta.descricao}
                      </p>
                      <div className="text-center">
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          {ferramenta.aplicacao}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carrosséis por categoria */}
            {!termoBusca && (
              <>
                {(filtroCategoria === 'Todas' || filtroCategoria === 'Calculadoras') && (
                  <CarrosselFerramentas 
                    ferramentas={calculadoras} 
                    titulo="Calculadoras" 
                    icone={Calculator}
                  />
                )}
                
                {(filtroCategoria === 'Todas' || filtroCategoria === 'Escalas') && (
                  <CarrosselFerramentas 
                    ferramentas={escalas} 
                    titulo="Escalas" 
                    icone={Scale}
                  />
                )}
              </>
            )}

            {/* Estatísticas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-nunito font-bold primary-color mb-4">
                Estatísticas das Ferramentas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient mb-2">
                    {calculadoras.length}
                  </div>
                  <div className="font-inter text-gray-600">Calculadoras</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient mb-2">
                    {escalas.length}
                  </div>
                  <div className="font-inter text-gray-600">Escalas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gradient mb-2">
                    {todasFerramentas.length}
                  </div>
                  <div className="font-inter text-gray-600">Total de Ferramentas</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {paginaAtual === 'posts' && <GeradorPosts />}

      {/* Modal de detalhes */}
      <ModalDetalhes 
        ferramenta={ferramentaSelecionada} 
        onClose={() => setFerramentaSelecionada(null)} 
      />

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="font-inter text-gray-600">
              © 2024 Calculadoras de Enfermagem. Desenvolvido para profissionais e estudantes de enfermagem.
            </p>
            <p className="font-inter text-sm text-gray-500 mt-2">
              Ferramentas baseadas em evidências científicas e diretrizes atualizadas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
