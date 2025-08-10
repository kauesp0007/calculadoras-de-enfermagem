import React from 'react';
import { Heart, Share2, Bookmark, MessageCircle, Eye } from 'lucide-react';

const PostIndividual = ({ ferramenta, formato = 'instagram' }) => {
  const isInstagram = formato === 'instagram';
  const isLinkedIn = formato === 'linkedin';

  const formatoClasses = {
    instagram: 'aspect-square max-w-md',
    linkedin: 'aspect-[1.91/1] max-w-2xl'
  };

  const PostInstagram = () => (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg ${formatoClasses.instagram} mx-auto`}>
      {/* Header do post */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-color rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-nunito font-semibold text-sm primary-color">
              Calculadoras de Enfermagem
            </h3>
            <p className="text-xs text-gray-500">Ferramentas essenciais</p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-6 flex flex-col items-center text-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="icon-container mb-4">
          <img 
            src={ferramenta.icone} 
            alt={ferramenta.nome}
            className="w-12 h-12"
          />
        </div>
        
        <h2 className="font-nunito font-bold text-lg primary-color mb-3 leading-tight">
          {ferramenta.nome}
        </h2>
        
        <p className="font-inter text-sm text-gray-700 mb-4 line-clamp-3">
          {ferramenta.descricao}
        </p>
        
        <div className="bg-white px-4 py-2 rounded-full">
          <span className="font-inter text-xs font-medium text-blue-700">
            {ferramenta.aplicacao}
          </span>
        </div>
      </div>

      {/* Footer com ações */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <Heart className="w-6 h-6 text-gray-600 hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="w-6 h-6 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors" />
            <Share2 className="w-6 h-6 text-gray-600 hover:text-green-500 cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-6 h-6 text-gray-600 hover:text-yellow-500 cursor-pointer transition-colors" />
        </div>
        
        <div className="text-xs text-gray-500 font-inter">
          <p className="font-semibold mb-1">1.2k curtidas</p>
          <p>
            <span className="font-semibold">calculadorasenfermagem</span> {ferramenta.importancia}
          </p>
          <p className="mt-2 text-gray-400">#enfermagem #{ferramenta.categoria.toLowerCase()} #saude</p>
        </div>
      </div>
    </div>
  );

  const PostLinkedIn = () => (
    <div className={`bg-white rounded-lg overflow-hidden shadow-lg ${formatoClasses.linkedin} mx-auto`}>
      {/* Header do post */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-color rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-nunito font-semibold text-base primary-color">
              Calculadoras de Enfermagem
            </h3>
            <p className="text-sm text-gray-500">Ferramentas essenciais para profissionais de saúde</p>
            <p className="text-xs text-gray-400">2h • 🌍</p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="font-nunito font-bold text-xl primary-color mb-3">
              {ferramenta.nome}
            </h2>
            
            <p className="font-inter text-gray-700 mb-4 leading-relaxed">
              {ferramenta.descricao}
            </p>
            
            <div className="mb-4">
              <h4 className="font-nunito font-semibold text-sm primary-color mb-2">
                💡 Aplicação Clínica:
              </h4>
              <p className="font-inter text-sm text-gray-600">
                {ferramenta.aplicacao}
              </p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-nunito font-semibold text-sm primary-color mb-2">
                ⭐ Importância:
              </h4>
              <p className="font-inter text-sm text-gray-600">
                {ferramenta.importancia}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                #{ferramenta.categoria}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                #Enfermagem
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                #Saúde
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="icon-container">
              <img 
                src={ferramenta.icone} 
                alt={ferramenta.nome}
                className="w-12 h-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer com ações */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
          <span>👍 ❤️ 💡 42 reações</span>
          <span>8 comentários • 15 compartilhamentos</span>
        </div>
        
        <div className="flex justify-around border-t border-gray-100 pt-3">
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="font-inter text-sm">Curtir</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="font-inter text-sm">Comentar</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="font-inter text-sm">Compartilhar</span>
          </button>
        </div>
      </div>
    </div>
  );

  return isInstagram ? <PostInstagram /> : <PostLinkedIn />;
};

export default PostIndividual;

