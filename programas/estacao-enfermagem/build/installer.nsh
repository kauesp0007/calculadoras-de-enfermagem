!macro customInstall
  DetailPrint "Os dados locais são preservados ao atualizar e desinstalar."
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TEXT "Estação de Enfermagem, um programa de Calculadoras de Enfermagem.$\r$\n$\r$\nhttps://www.calculadorasdeenfermagem.com.br/$\r$\nciadeenfermagem@gmail.com.br$\r$\n$\r$\nOs dados locais são preservados nas atualizações."
  !insertmacro MUI_PAGE_WELCOME
!macroend
