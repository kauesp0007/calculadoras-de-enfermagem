/*
 * Card de divulgação do plano Premium nas páginas principais de cada idioma.
 *
 * O controle canônico de AdSense é feito por global-scripts.js.
 */
(function (window, document) {
    "use strict";

    window.AccessModules = window.AccessModules || {};

    var _mounted = false;
    var _root = null;
    var _promoRoot = null;
    var _promoTimers = [];
    var ADS_CLIENT = "ca-pub-6472730056006847";
    var _adsenseLoading = false;

    // Preços e moedas seguem o checkout internacional de /conta/assinatura.html.
    // A cobrança efetiva continua sendo definida pelo Price do Stripe no backend.
    var EUR_LANGS = ["tr", "nl", "pl", "ru", "fr", "es", "de", "it", "uk", "sv"];
    var PROMO_COPY = {
            "pt": {
                    "eyebrow": "EQUIPE PREMIUM",
                    "title": "Faça parte da Equipe Premium",
                    "benefits": [
                            "Elimine 100% dos anúncios indesejados",
                            "Tenha acesso a mais de 30 calculadoras para a enfermagem",
                            "Tenha acesso a mais de 65 escalas assistenciais interativas",
                            "Salve ou imprima os formulários em branco das escalas assistenciais para usar no plantão",
                            "São mais de 25 simulados por categorias e provas de bancas para você treinar",
                            "Você terá acesso a extensões gratuitas do Chrome de Gasometria Arterial e Escala de Braden, e em breve serão lançadas novas extensões para o navegador",
                            "Em breve será lançado um programa de computador e um app para auxiliar você durante o plantão",
                            "Ajude este projeto a unificar em um único site tudo o que a enfermagem precisa",
                            "Nossos conteúdos educativos contam com um sistema de auditoria e governança de fontes, com o princípio de garantir, checar, revisar e auditar a literatura apresentada, com referências científicas seguras"
                    ],
                    "subscribe": "Assine o Plano PREMIUM e faça parte da equipe!",
                    "price": "Por apenas R$ 5,00 mensais. Aceitamos Pix e cartões.",
                    "close": "Fechar",
                    "alt": "Ilustração azul de uma profissional de enfermagem com máscara",
                    "aria": "Assinatura Premium"
            },
            "en": {
                    "eyebrow": "PREMIUM TEAM",
                    "title": "Join the Premium Team",
                    "benefits": [
                            "Remove 100% of unwanted ads",
                            "Get access to more than 30 nursing calculators",
                            "Get access to more than 65 interactive clinical nursing scales",
                            "Save or print blank clinical scale forms to use during your shift",
                            "Practice with more than 25 category-based and exam-board mock tests",
                            "Get free Chrome extensions for Arterial Blood Gas and the Braden Scale, with more browser extensions coming soon",
                            "A desktop program and an app to support you during your shift are coming soon",
                            "Help this project bring together in one website everything nursing professionals need",
                            "Our educational content uses a source-audit and governance system designed to verify, review and audit the presented literature using reliable scientific references"
                    ],
                    "subscribe": "Subscribe to PREMIUM and join the team!",
                    "price": "Only {price} per month. Credit cards accepted.",
                    "close": "Close",
                    "alt": "Blue illustration of a masked nurse",
                    "aria": "Premium subscription"
            },
            "es": {
                    "eyebrow": "EQUIPO PREMIUM",
                    "title": "Forma parte del Equipo Premium",
                    "benefits": [
                            "Elimina el 100% de los anuncios no deseados",
                            "Accede a más de 30 calculadoras para enfermería",
                            "Accede a más de 65 escalas asistenciales interactivas",
                            "Guarda o imprime los formularios en blanco de las escalas asistenciales para usarlos durante el turno",
                            "Practica con más de 25 simulacros por categorías y pruebas de bancas examinadoras",
                            "Accede a extensiones gratuitas de Chrome para gasometría arterial y Escala de Braden, con nuevas extensiones próximamente",
                            "Próximamente se lanzarán un programa para computadora y una app para ayudarte durante el turno",
                            "Ayuda a este proyecto a reunir en un solo sitio todo lo que necesita enfermería",
                            "Nuestros contenidos educativos cuentan con un sistema de auditoría y gobernanza de fuentes para verificar, revisar y auditar la literatura presentada con referencias científicas confiables"
                    ],
                    "subscribe": "¡Suscríbete al plan PREMIUM y forma parte del equipo!",
                    "price": "Por solo {price} al mes. Aceptamos tarjetas de crédito.",
                    "close": "Cerrar",
                    "alt": "Ilustración azul de una profesional de enfermería con mascarilla",
                    "aria": "Suscripción Premium"
            },
            "fr": {
                    "eyebrow": "ÉQUIPE PREMIUM",
                    "title": "Rejoignez l’équipe Premium",
                    "benefits": [
                            "Supprimez 100 % des publicités indésirables",
                            "Accédez à plus de 30 calculateurs pour les soins infirmiers",
                            "Accédez à plus de 65 échelles cliniques interactives",
                            "Enregistrez ou imprimez les formulaires vierges des échelles cliniques pour vos gardes",
                            "Entraînez-vous avec plus de 25 examens blancs par catégorie et organisme d’examen",
                            "Profitez d’extensions Chrome gratuites pour les gaz du sang artériel et l’échelle de Braden, avec d’autres extensions bientôt disponibles",
                            "Un logiciel pour ordinateur et une application pour vous aider pendant vos gardes seront bientôt lancés",
                            "Aidez ce projet à réunir sur un seul site tout ce dont les professionnels infirmiers ont besoin",
                            "Nos contenus éducatifs disposent d’un système d’audit et de gouvernance des sources pour vérifier, réviser et auditer la littérature présentée à partir de références scientifiques fiables"
                    ],
                    "subscribe": "Abonnez-vous au plan PREMIUM et rejoignez l’équipe !",
                    "price": "Seulement {price} par mois. Cartes bancaires acceptées.",
                    "close": "Fermer",
                    "alt": "Illustration bleue d’une infirmière masquée",
                    "aria": "Abonnement Premium"
            },
            "it": {
                    "eyebrow": "TEAM PREMIUM",
                    "title": "Entra nel Team Premium",
                    "benefits": [
                            "Elimina il 100% degli annunci indesiderati",
                            "Accedi a più di 30 calcolatori per l’infermieristica",
                            "Accedi a più di 65 scale assistenziali interattive",
                            "Salva o stampa i moduli vuoti delle scale assistenziali da usare durante il turno",
                            "Allenati con più di 25 simulazioni per categorie e prove d’esame",
                            "Accedi gratuitamente alle estensioni Chrome per emogasanalisi arteriosa e Scala di Braden, con nuove estensioni in arrivo",
                            "Presto saranno disponibili un programma per computer e un’app per aiutarti durante il turno",
                            "Aiuta questo progetto a riunire in un unico sito tutto ciò di cui l’infermieristica ha bisogno",
                            "I nostri contenuti educativi utilizzano un sistema di audit e governance delle fonti per verificare, revisionare e controllare la letteratura presentata con riferimenti scientifici affidabili"
                    ],
                    "subscribe": "Abbonati al piano PREMIUM ed entra nel team!",
                    "price": "Solo {price} al mese. Accettiamo carte di credito.",
                    "close": "Chiudi",
                    "alt": "Illustrazione blu di un’infermiera con mascherina",
                    "aria": "Abbonamento Premium"
            },
            "de": {
                    "eyebrow": "PREMIUM-TEAM",
                    "title": "Werden Sie Teil des Premium-Teams",
                    "benefits": [
                            "Entfernen Sie 100 % der unerwünschten Werbung",
                            "Nutzen Sie mehr als 30 Rechner für die Pflege",
                            "Nutzen Sie mehr als 65 interaktive pflegerische Beurteilungsskalen",
                            "Speichern oder drucken Sie leere Formulare der Beurteilungsskalen für Ihren Dienst",
                            "Trainieren Sie mit mehr als 25 Übungsprüfungen nach Kategorien und Prüfungsanbietern",
                            "Nutzen Sie kostenlose Chrome-Erweiterungen für arterielle Blutgasanalyse und Braden-Skala; weitere Erweiterungen folgen",
                            "Demnächst erscheinen ein Computerprogramm und eine App zur Unterstützung während Ihres Dienstes",
                            "Unterstützen Sie dieses Projekt dabei, alles Wichtige für die Pflege auf einer einzigen Website zu vereinen",
                            "Unsere Lerninhalte verfügen über ein System zur Quellenprüfung und -governance, das die dargestellte Literatur mit verlässlichen wissenschaftlichen Referenzen prüft, überprüft und auditiert"
                    ],
                    "subscribe": "PREMIUM abonnieren und Teil des Teams werden!",
                    "price": "Nur {price} pro Monat. Zahlung per Kreditkarte.",
                    "close": "Schließen",
                    "alt": "Blaue Illustration einer maskierten Pflegefachperson",
                    "aria": "Premium-Abonnement"
            },
            "hi": {
                    "eyebrow": "प्रीमियम टीम",
                    "title": "प्रीमियम टीम का हिस्सा बनें",
                    "benefits": [
                            "100% अनचाहे विज्ञापन हटाएँ",
                            "नर्सिंग के लिए 30 से अधिक कैलकुलेटर का उपयोग करें",
                            "65 से अधिक इंटरैक्टिव क्लिनिकल नर्सिंग स्केल का उपयोग करें",
                            "ड्यूटी के दौरान उपयोग के लिए क्लिनिकल स्केल के खाली फॉर्म सहेजें या प्रिंट करें",
                            "श्रेणियों और परीक्षा बोर्डों के 25 से अधिक मॉक टेस्ट से अभ्यास करें",
                            "आर्टेरियल ब्लड गैस और ब्रेडन स्केल के लिए मुफ्त Chrome एक्सटेंशन पाएँ; जल्द और एक्सटेंशन आएँगे",
                            "आपकी ड्यूटी में सहायता के लिए जल्द एक कंप्यूटर प्रोग्राम और ऐप लॉन्च होंगे",
                            "नर्सिंग की जरूरतों को एक ही वेबसाइट पर एकत्र करने वाले इस प्रोजेक्ट का समर्थन करें",
                            "हमारी शैक्षिक सामग्री में स्रोत ऑडिट और गवर्नेंस प्रणाली है, जो विश्वसनीय वैज्ञानिक संदर्भों के आधार पर साहित्य की जाँच, समीक्षा और ऑडिट करती है"
                    ],
                    "subscribe": "PREMIUM लें और टीम का हिस्सा बनें!",
                    "price": "केवल {price} प्रति माह। क्रेडिट कार्ड स्वीकार किए जाते हैं।",
                    "close": "बंद करें",
                    "alt": "मास्क पहने नर्स का नीला चित्र",
                    "aria": "प्रीमियम सदस्यता"
            },
            "zh": {
                    "eyebrow": "高级会员团队",
                    "title": "加入高级会员团队",
                    "benefits": [
                            "移除 100% 不需要的广告",
                            "使用 30 多个护理计算器",
                            "使用 65 多个交互式护理评估量表",
                            "保存或打印空白护理量表表格，值班时直接使用",
                            "按类别和考试机构练习 25 套以上模拟测试",
                            "免费使用动脉血气和 Braden 量表 Chrome 扩展，更多浏览器扩展即将推出",
                            "用于值班辅助的电脑程序和应用即将推出",
                            "支持本项目，把护理人员所需内容集中到一个网站",
                            "我们的教育内容采用来源审计与治理系统，以可靠科学参考文献为基础进行核验、复核和审计"
                    ],
                    "subscribe": "订阅高级会员并加入团队！",
                    "price": "每月仅需 {price}。接受信用卡付款。",
                    "close": "关闭",
                    "alt": "戴口罩护士的蓝色插画",
                    "aria": "高级会员订阅"
            },
            "ja": {
                    "eyebrow": "プレミアムチーム",
                    "title": "プレミアムチームに参加",
                    "benefits": [
                            "不要な広告を100%削除",
                            "看護向け計算ツールを30種類以上利用",
                            "インタラクティブな看護評価スケールを65種類以上利用",
                            "勤務中に使える評価スケールの空白フォームを保存・印刷",
                            "カテゴリ別・試験機関別の模擬試験を25種類以上利用",
                            "動脈血液ガスとBradenスケールの無料Chrome拡張を利用でき、今後さらに追加予定",
                            "勤務を支援するPCプログラムとアプリを近日公開",
                            "看護に必要なものを1つのサイトに集約するこのプロジェクトを応援",
                            "教育コンテンツは、信頼できる科学的参考文献を用いて文献を確認・再検証・監査する情報源ガバナンス監査システムを採用"
                    ],
                    "subscribe": "PREMIUMに登録してチームに参加！",
                    "price": "月額わずか{price}。クレジットカードをご利用いただけます。",
                    "close": "閉じる",
                    "alt": "マスクを着けた看護師の青いイラスト",
                    "aria": "プレミアム会員"
            },
            "ru": {
                    "eyebrow": "ПРЕМИУМ-КОМАНДА",
                    "title": "Присоединяйтесь к Премиум-команде",
                    "benefits": [
                            "Уберите 100% нежелательной рекламы",
                            "Получите доступ более чем к 30 калькуляторам для сестринского дела",
                            "Используйте более 65 интерактивных клинических шкал",
                            "Сохраняйте или печатайте пустые формы клинических шкал для работы на смене",
                            "Тренируйтесь с более чем 25 пробными тестами по категориям и экзаменационным организациям",
                            "Получите бесплатные расширения Chrome для газов артериальной крови и шкалы Брадена; новые расширения появятся скоро",
                            "Скоро выйдут компьютерная программа и приложение для помощи во время смены",
                            "Поддержите проект, объединяющий всё необходимое для сестринского дела на одном сайте",
                            "Наши образовательные материалы используют систему аудита и управления источниками для проверки, рецензирования и аудита литературы на основе надёжных научных ссылок"
                    ],
                    "subscribe": "Оформите PREMIUM и присоединяйтесь к команде!",
                    "price": "Всего {price} в месяц. Принимаем кредитные карты.",
                    "close": "Закрыть",
                    "alt": "Синяя иллюстрация медсестры в маске",
                    "aria": "Премиум-подписка"
            },
            "ko": {
                    "eyebrow": "프리미엄 팀",
                    "title": "프리미엄 팀에 참여하세요",
                    "benefits": [
                            "원치 않는 광고를 100% 제거",
                            "간호용 계산기 30개 이상 이용",
                            "대화형 간호 평가척도 65개 이상 이용",
                            "근무 중 사용할 수 있도록 평가척도 빈 양식을 저장하거나 인쇄",
                            "카테고리별·시험기관별 모의시험 25개 이상으로 연습",
                            "동맥혈가스와 Braden 척도용 무료 Chrome 확장 프로그램 이용, 추가 확장 프로그램도 곧 제공",
                            "근무를 돕는 PC 프로그램과 앱이 곧 출시될 예정",
                            "간호에 필요한 모든 것을 하나의 사이트에 모으는 프로젝트를 지원",
                            "교육 콘텐츠는 신뢰할 수 있는 과학 참고문헌을 바탕으로 문헌을 확인·검토·감사하는 출처 감사 및 거버넌스 시스템을 사용"
                    ],
                    "subscribe": "PREMIUM을 구독하고 팀에 참여하세요!",
                    "price": "월 {price}. 신용카드 결제가 가능합니다.",
                    "close": "닫기",
                    "alt": "마스크를 쓴 간호사의 파란색 일러스트",
                    "aria": "프리미엄 구독"
            },
            "tr": {
                    "eyebrow": "PREMIUM EKİBİ",
                    "title": "Premium Ekibine Katılın",
                    "benefits": [
                            "İstenmeyen reklamların %100’ünü kaldırın",
                            "Hemşirelik için 30’dan fazla hesaplayıcıya erişin",
                            "65’ten fazla etkileşimli klinik hemşirelik ölçeğine erişin",
                            "Nöbette kullanmak için klinik ölçeklerin boş formlarını kaydedin veya yazdırın",
                            "Kategori ve sınav kurumlarına göre 25’ten fazla deneme sınavıyla pratik yapın",
                            "Arteriyel kan gazı ve Braden Ölçeği için ücretsiz Chrome eklentilerine erişin; yeni eklentiler yakında",
                            "Nöbetinizde size yardımcı olacak bilgisayar programı ve uygulama yakında yayınlanacak",
                            "Hemşireliğin ihtiyaç duyduğu her şeyi tek bir sitede birleştiren bu projeye destek olun",
                            "Eğitim içeriklerimiz, güvenilir bilimsel kaynaklarla sunulan literatürü doğrulayan, gözden geçiren ve denetleyen kaynak yönetişimi ve denetim sistemi kullanır"
                    ],
                    "subscribe": "PREMIUM’a abone olun ve ekibe katılın!",
                    "price": "Ayda yalnızca {price}. Kredi kartı kabul edilir.",
                    "close": "Kapat",
                    "alt": "Maskeli hemşirenin mavi illüstrasyonu",
                    "aria": "Premium abonelik"
            },
            "nl": {
                    "eyebrow": "PREMIUM-TEAM",
                    "title": "Word lid van het Premium-team",
                    "benefits": [
                            "Verwijder 100% van ongewenste advertenties",
                            "Krijg toegang tot meer dan 30 verpleegkundige calculators",
                            "Krijg toegang tot meer dan 65 interactieve klinische schalen",
                            "Sla lege formulieren van klinische schalen op of print ze voor gebruik tijdens je dienst",
                            "Oefen met meer dan 25 proefexamens per categorie en exameninstantie",
                            "Gebruik gratis Chrome-extensies voor arteriële bloedgassen en de Braden-schaal; meer extensies volgen binnenkort",
                            "Binnenkort verschijnen een computerprogramma en app om je tijdens je dienst te ondersteunen",
                            "Steun dit project om alles wat verpleegkundigen nodig hebben op één site samen te brengen",
                            "Onze educatieve inhoud gebruikt een systeem voor broncontrole en governance dat literatuur controleert, beoordeelt en auditeert op basis van betrouwbare wetenschappelijke referenties"
                    ],
                    "subscribe": "Neem PREMIUM en word lid van het team!",
                    "price": "Slechts {price} per maand. Creditcards worden geaccepteerd.",
                    "close": "Sluiten",
                    "alt": "Blauwe illustratie van een gemaskerde verpleegkundige",
                    "aria": "Premium-abonnement"
            },
            "pl": {
                    "eyebrow": "ZESPÓŁ PREMIUM",
                    "title": "Dołącz do Zespołu Premium",
                    "benefits": [
                            "Usuń 100% niechcianych reklam",
                            "Uzyskaj dostęp do ponad 30 kalkulatorów pielęgniarskich",
                            "Uzyskaj dostęp do ponad 65 interaktywnych skal klinicznych",
                            "Zapisuj lub drukuj puste formularze skal klinicznych do wykorzystania podczas dyżuru",
                            "Ćwicz z ponad 25 testami próbnymi według kategorii i organizatorów egzaminów",
                            "Korzystaj z bezpłatnych rozszerzeń Chrome do gazometrii tętniczej i skali Braden; kolejne rozszerzenia pojawią się wkrótce",
                            "Wkrótce pojawią się program komputerowy i aplikacja wspierające podczas dyżuru",
                            "Wesprzyj projekt łączący w jednym serwisie wszystko, czego potrzebuje pielęgniarstwo",
                            "Nasze treści edukacyjne korzystają z systemu audytu i zarządzania źródłami, który weryfikuje, recenzuje i audytuje literaturę na podstawie wiarygodnych źródeł naukowych"
                    ],
                    "subscribe": "Wybierz PREMIUM i dołącz do zespołu!",
                    "price": "Tylko {price} miesięcznie. Akceptujemy karty kredytowe.",
                    "close": "Zamknij",
                    "alt": "Niebieska ilustracja pielęgniarki w maseczce",
                    "aria": "Subskrypcja Premium"
            },
            "sv": {
                    "eyebrow": "PREMIUM-TEAM",
                    "title": "Bli en del av Premium-teamet",
                    "benefits": [
                            "Ta bort 100% av oönskade annonser",
                            "Få tillgång till fler än 30 kalkylatorer för omvårdnad",
                            "Få tillgång till fler än 65 interaktiva kliniska skattningsskalor",
                            "Spara eller skriv ut tomma formulär för kliniska skalor att använda under arbetspasset",
                            "Träna med fler än 25 övningsprov efter kategori och examensorgan",
                            "Få gratis Chrome-tillägg för arteriell blodgas och Braden-skalan; fler tillägg kommer snart",
                            "Ett datorprogram och en app som hjälper dig under arbetspasset lanseras snart",
                            "Stöd projektet som samlar allt omvårdnaden behöver på en enda webbplats",
                            "Vårt utbildningsinnehåll använder ett system för källgranskning och styrning som verifierar, granskar och auditerar litteraturen med tillförlitliga vetenskapliga referenser"
                    ],
                    "subscribe": "Prenumerera på PREMIUM och bli en del av teamet!",
                    "price": "Endast {price} per månad. Kreditkort accepteras.",
                    "close": "Stäng",
                    "alt": "Blå illustration av en maskerad sjuksköterska",
                    "aria": "Premium-abonnemang"
            },
            "id": {
                    "eyebrow": "TIM PREMIUM",
                    "title": "Bergabunglah dengan Tim Premium",
                    "benefits": [
                            "Hilangkan 100% iklan yang tidak diinginkan",
                            "Akses lebih dari 30 kalkulator keperawatan",
                            "Akses lebih dari 65 skala klinis keperawatan interaktif",
                            "Simpan atau cetak formulir kosong skala klinis untuk digunakan saat bertugas",
                            "Berlatih dengan lebih dari 25 simulasi berdasarkan kategori dan lembaga ujian",
                            "Dapatkan ekstensi Chrome gratis untuk Analisis Gas Darah Arteri dan Skala Braden; ekstensi baru akan segera hadir",
                            "Program komputer dan aplikasi untuk membantu saat bertugas akan segera diluncurkan",
                            "Dukung proyek yang menyatukan semua kebutuhan keperawatan dalam satu situs",
                            "Konten edukasi kami menggunakan sistem audit dan tata kelola sumber untuk memverifikasi, meninjau, dan mengaudit literatur berdasarkan referensi ilmiah yang tepercaya"
                    ],
                    "subscribe": "Berlangganan PREMIUM dan bergabung dengan tim!",
                    "price": "Hanya {price} per bulan. Kartu kredit diterima.",
                    "close": "Tutup",
                    "alt": "Ilustrasi biru perawat bermasker",
                    "aria": "Langganan Premium"
            },
            "vi": {
                    "eyebrow": "ĐỘI PREMIUM",
                    "title": "Tham gia Đội ngũ Premium",
                    "benefits": [
                            "Loại bỏ 100% quảng cáo không mong muốn",
                            "Truy cập hơn 30 công cụ tính dành cho điều dưỡng",
                            "Truy cập hơn 65 thang đánh giá lâm sàng tương tác",
                            "Lưu hoặc in các biểu mẫu trống của thang đánh giá để dùng trong ca trực",
                            "Luyện tập với hơn 25 bài thi thử theo danh mục và đơn vị tổ chức thi",
                            "Sử dụng miễn phí tiện ích Chrome cho khí máu động mạch và thang Braden; nhiều tiện ích mới sắp ra mắt",
                            "Sắp ra mắt chương trình máy tính và ứng dụng hỗ trợ bạn trong ca trực",
                            "Hỗ trợ dự án tập hợp mọi thứ điều dưỡng cần trên một website",
                            "Nội dung giáo dục của chúng tôi sử dụng hệ thống kiểm toán và quản trị nguồn để xác minh, rà soát và kiểm toán tài liệu dựa trên các tài liệu tham khảo khoa học đáng tin cậy"
                    ],
                    "subscribe": "Đăng ký PREMIUM và tham gia đội ngũ!",
                    "price": "Chỉ {price} mỗi tháng. Chấp nhận thẻ tín dụng.",
                    "close": "Đóng",
                    "alt": "Minh họa màu xanh của y tá đeo khẩu trang",
                    "aria": "Gói đăng ký Premium"
            },
            "uk": {
                    "eyebrow": "ПРЕМІУМ-КОМАНДА",
                    "title": "Приєднуйтеся до Преміум-команди",
                    "benefits": [
                            "Приберіть 100% небажаної реклами",
                            "Отримайте доступ до понад 30 калькуляторів для медсестринства",
                            "Отримайте доступ до понад 65 інтерактивних клінічних шкал",
                            "Зберігайте або друкуйте порожні форми клінічних шкал для використання під час зміни",
                            "Тренуйтеся з понад 25 пробними тестами за категоріями та екзаменаційними організаціями",
                            "Отримайте безкоштовні розширення Chrome для газів артеріальної крові та шкали Брадена; нові розширення з’являться незабаром",
                            "Незабаром вийдуть комп’ютерна програма та застосунок для допомоги під час зміни",
                            "Підтримайте проєкт, що об’єднує все необхідне для медсестринства на одному сайті",
                            "Наші освітні матеріали використовують систему аудиту та управління джерелами для перевірки, рецензування й аудиту літератури на основі надійних наукових посилань"
                    ],
                    "subscribe": "Оформіть PREMIUM і приєднуйтеся до команди!",
                    "price": "Лише {price} на місяць. Приймаємо кредитні картки.",
                    "close": "Закрити",
                    "alt": "Синя ілюстрація медсестри в масці",
                    "aria": "Преміум-підписка"
            },
            "ar": {
                    "eyebrow": "فريق بريميوم",
                    "title": "انضم إلى فريق بريميوم",
                    "benefits": [
                            "تخلّص من 100% من الإعلانات غير المرغوب فيها",
                            "احصل على أكثر من 30 حاسبة للتمريض",
                            "احصل على أكثر من 65 مقياسًا سريريًا تفاعليًا للتمريض",
                            "احفظ أو اطبع النماذج الفارغة للمقاييس السريرية لاستخدامها أثناء المناوبة",
                            "تدرّب على أكثر من 25 اختبارًا تجريبيًا حسب الفئة والجهة الممتحنة",
                            "احصل على إضافات Chrome مجانية لغازات الدم الشرياني ومقياس Braden، مع إضافات جديدة قريبًا",
                            "سيتم قريبًا إطلاق برنامج للكمبيوتر وتطبيق لمساعدتك أثناء المناوبة",
                            "ادعم هذا المشروع الذي يجمع كل ما يحتاجه التمريض في موقع واحد",
                            "تستخدم موادنا التعليمية نظام تدقيق وحوكمة للمصادر للتحقق من الأدبيات ومراجعتها وتدقيقها بالاستناد إلى مراجع علمية موثوقة"
                    ],
                    "subscribe": "اشترك في PREMIUM وانضم إلى الفريق!",
                    "price": "مقابل {price} شهريًا فقط. نقبل بطاقات الائتمان.",
                    "close": "إغلاق",
                    "alt": "رسم أزرق لممرضة ترتدي قناعًا",
                    "aria": "اشتراك بريميوم"
            }
    };

    function isAccountPage() {
        return /^\\/(?:(?:en|es|fr|it|de|hi|zh|ja|ru|ko|tr|nl|pl|sv|id|vi|uk|ar)\\/)?conta\\//i.test(window.location.pathname || "");
    }

    function isPremiumRoute() {
        return window.__IS_PREMIUM_ROUTE === true;
    }

    function promoLanguage() {
        var pathname = (window.location.pathname || "/").toLowerCase();
        if (pathname !== "/" && !/\.html$/.test(pathname)) return null;
        var parts = pathname.split("/").filter(Boolean);
        if (parts.length && Object.prototype.hasOwnProperty.call(PROMO_COPY, parts[0])) return parts[0];
        return "pt";
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
        });
    }

    function isPromoEligible() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;
        if (!auth.currentUser || !auth.currentUser()) return true;

        // Um usuário logado só é Free depois que o billing confirma esse plano.
        var billing = auth.billingStatus && auth.billingStatus();
        return !!(billing && billing.resolved && !billing.unavailable &&
            billing.plan === "free" && auth.hasPlan && !auth.hasPlan("premium"));
    }

    function syncPromoEligibility() {
        if (isPromoEligible()) {
            mountSubscriptionPromo();
        } else if (window.__premiumPromoController) {
            window.__premiumPromoController.dispose();
        }
    }

    function isPremiumProfile(profile) {
        // Premium mantém anúncios ativos; este módulo não remove anúncios.
        return false;
    }

    function authStateResolvedForAds() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;

        var user = auth.currentUser ? auth.currentUser() : null;
        if (!user) return true;

        var profile = auth.profile ? auth.profile() : null;
        return !!profile;
    }

    function adsAllowed() {
        var auth = window.Auth;
        if (!auth || !auth.isInitialized || !auth.isInitialized()) return false;

        var user = auth.currentUser ? auth.currentUser() : null;
        if (!user) return true;

        var profile = auth.profile ? auth.profile() : null;
        if (!profile) return false;

        return true;
    }

    function consentAllowsAds() {
        try {
            var consent = localStorage.getItem("cookieConsent");
            if (consent === "refused") return false;
            if (consent === "managed" && localStorage.getItem("ad_storage") === "denied") return false;
        } catch (_) { }
        return true;
    }

    function loadAdSenseForEligibleUser() {
        return; // DESATIVADO: global-scripts.js é o único carregador de AdSense.
        if (isAccountPage() || !authStateResolvedForAds() || !adsAllowed() || !consentAllowsAds()) return;
        if (window.__adsenseLoaded || _adsenseLoading) return;

        var existing = document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
        if (existing) {
            window.__adsenseLoaded = true;
            return;
        }

        _adsenseLoading = true;
        var script = document.createElement("script");
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS_CLIENT;
        script.crossOrigin = "anonymous";
        script.onload = function () {
            _adsenseLoading = false;
            window.__adsenseLoaded = true;
        };
        script.onerror = function () {
            _adsenseLoading = false;
            window.__adsenseLoaded = false;
            setTimeout(loadAdSenseForEligibleUser, 3000);
        };
        document.head.appendChild(script);
    }

    function syncAds() {
        if (isAccountPage()) return;
        loadAdSenseForEligibleUser();
    }

    function bindAuthGuards() {
        var auth = window.Auth;
        if (!auth) return;

        if (auth.onAuthChange) {
            auth.onAuthChange(function () {
                syncAds();
                syncPromoEligibility();
            });
        }

        if (auth.onProfileChange) {
            auth.onProfileChange(function () {
                syncAds();
                syncPromoEligibility();
            });
        }

        if (auth.isInitialized && auth.isInitialized()) {
            syncAds();
        }
    }

    function mountSubscriptionPromo() {
        var lang = promoLanguage();
        if (!lang) return;

        if (!isPromoEligible()) return;

        // Uma única instância por página e intervalo de dois minutos entre exibições, inclusive sem navegação.
        if (window.__premiumPromoController) return;

        var STORAGE_KEY = lang === "pt" ? "premiumPromoLastShownAt" : "premiumPromoLastShownAt:" + lang;
        var DISPLAY_MS = 20000;
        var INTERVAL_MS = 2 * 60 * 1000;
        var INITIAL_DELAY_MS = 1500;
        var lastShownInMemory = 0;
        var copy = PROMO_COPY[lang];
        var price = lang === "pt" ? "" : (EUR_LANGS.indexOf(lang) !== -1 ? "€ 5,00" : "US$ 5,00");
        var priceLine = copy.price.replace("{price}", price);
        var subscribeUrl = lang === "pt" ? "/conta/assinatura.html" : "/conta/assinatura.html?lang=" + lang;

        function readLastShown() {
            try {
                var value = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
                return Number.isFinite(value) ? Math.max(value, lastShownInMemory) : lastShownInMemory;
            } catch (_) {
                return lastShownInMemory;
            }
        }

        function writeLastShown() {
            lastShownInMemory = Date.now();
            try { localStorage.setItem(STORAGE_KEY, String(lastShownInMemory)); } catch (_) { }
        }

        var root = document.createElement("div");
        root.id = "premium-promo-banner";
        root.setAttribute("role", "complementary");
        root.setAttribute("aria-label", copy.aria);
        root.setAttribute("lang", lang === "pt" ? "pt-BR" : lang);
        if (lang === "ar") root.setAttribute("dir", "rtl");
        root.style.cssText = "position:fixed;top:140px;right:12px;width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 20px);overflow:auto;overscroll-behavior:contain;z-index:2147483000;display:none;opacity:0;pointer-events:none;transition:opacity .18s ease;";

        function positionPromo() {
            var bottoms = [0];
            [
                document.getElementById("barraAcessibilidade"),
                document.getElementById("global-header-container"),
                document.getElementById("language-selector-placeholder")
            ].forEach(function (el) {
                if (!el) return;
                var rect = el.getBoundingClientRect();
                if (rect && rect.bottom > 0) bottoms.push(rect.bottom);
            });
            var top = Math.max.apply(null, bottoms) + 12;
            var maxTop = Math.max(8, window.innerHeight - (root.getBoundingClientRect().height || 620) - 12);
            top = Math.min(top, maxTop);
            root.style.top = Math.round(top) + "px";
        }

        var checkIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style="flex:none;color:#16a34a;margin-top:2px"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="m7.5 12.2 3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (!document.getElementById("premium-promo-responsive-style")) {
            var responsiveStyle = document.createElement("style");
            responsiveStyle.id = "premium-promo-responsive-style";
            responsiveStyle.textContent =
                "#premium-promo-banner .premium-promo-card{padding:17px 18px 16px;border-radius:18px;background:linear-gradient(145deg,#eff8ff 0%,#dbeeff 100%);border:1px solid rgba(26,62,116,.18);box-shadow:0 16px 38px rgba(15,23,42,.22);font-family:Inter,Arial,sans-serif;color:#163269;}" +
                "#premium-promo-banner .premium-promo-head{display:grid;grid-template-columns:minmax(0,1fr) 118px;align-items:center;gap:12px;direction:ltr;}" +
                "#premium-promo-banner .premium-promo-eyebrow{margin:0 0 6px;font-size:11px;line-height:1.2;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#2563eb;}" +
                "#premium-promo-banner .premium-promo-rule{width:92px;height:3px;margin:0 0 8px;border-radius:999px;background:#f5b400;}" +
                "#premium-promo-banner .premium-promo-title{margin:0;font-size:23px;line-height:1.08;font-weight:900;color:#123d7a;}" +
                "#premium-promo-banner .premium-promo-img{display:block;width:118px;height:138px;object-fit:contain;}" +
                "#premium-promo-banner .premium-promo-benefits{display:grid;gap:7px;margin:12px 0 0;padding:0;list-style:none;font-size:13px;line-height:1.38;font-weight:650;}" +
                "#premium-promo-banner .premium-promo-benefits li{display:flex;align-items:flex-start;gap:8px;}" +
                "#premium-promo-banner .premium-promo-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;margin-top:13px;}" +
                "#premium-promo-banner .premium-promo-subscribe{display:flex;align-items:center;justify-content:center;min-height:44px;padding:9px 14px;border-radius:11px;background:linear-gradient(90deg,#facc15,#f59e0b);color:#123d7a;text-decoration:none;font-size:13px;line-height:1.2;font-weight:900;text-align:center;box-shadow:0 5px 12px rgba(15,23,42,.12);}" +
                "#premium-promo-banner .premium-promo-price{margin:6px 0 0;font-size:10px;line-height:1.35;color:#475569;}" +
                "#premium-promo-banner .premium-promo-close{min-height:40px;padding:9px 12px;border:1px solid #334155;border-radius:9px;background:#334155;color:#fff;font-size:12px;font-weight:800;cursor:pointer;}" +
                "#premium-promo-banner a:focus-visible,#premium-promo-banner button:focus-visible{outline:3px solid #f59e0b;outline-offset:3px;}" +
                "@media(max-width:640px){#premium-promo-banner{right:8px!important;width:calc(100vw - 16px)!important;max-height:calc(100vh - 16px)!important;}#premium-promo-banner .premium-promo-card{padding:13px 13px 12px;border-radius:15px;}#premium-promo-banner .premium-promo-head{grid-template-columns:minmax(0,1fr) 82px;gap:8px;}#premium-promo-banner .premium-promo-img{width:82px;height:96px;}#premium-promo-banner .premium-promo-title{font-size:19px;}#premium-promo-banner .premium-promo-eyebrow{font-size:9px;}#premium-promo-banner .premium-promo-benefits{font-size:11.5px;gap:6px;line-height:1.32;}#premium-promo-banner .premium-promo-actions{grid-template-columns:1fr;gap:7px;}#premium-promo-banner .premium-promo-close{width:100%;}}" +
                "@media(prefers-reduced-motion:reduce){#premium-promo-banner{transition:none!important;}}";
            document.head.appendChild(responsiveStyle);
        }
        root.innerHTML =
            '<section class="premium-promo-card">' +
            '<div class="premium-promo-head">' +
            '<div' + (lang === "ar" ? ' dir="rtl"' : '') + '><p class="premium-promo-eyebrow">' + escapeHtml(copy.eyebrow) + '</p><div class="premium-promo-rule" aria-hidden="true"></div>' +
            '<h2 class="premium-promo-title">' + escapeHtml(copy.title) + '</h2></div>' +
            '<img class="premium-promo-img" src="/Imagens_autorais/enfermeira-de-mascara-azul.svg" alt="' + escapeHtml(copy.alt) + '" width="118" height="138" decoding="async">' +
            '</div><ul class="premium-promo-benefits">' +
            copy.benefits.map(function (benefit) {
                return '<li>' + checkIcon + '<span>' + escapeHtml(benefit) + '</span></li>';
            }).join("") +
            '</ul><div class="premium-promo-actions">' +
            '<div><a class="premium-promo-subscribe" href="' + subscribeUrl + '" data-premium-promo-subscribe>' + escapeHtml(copy.subscribe) + '</a>' +
            '<p class="premium-promo-price">' + escapeHtml(priceLine) + '</p></div>' +
            '<button class="premium-promo-close" type="button" aria-label="' + escapeHtml(copy.close) + '" data-premium-promo-close>' + escapeHtml(copy.close) + '</button>' +
            '</div></section>';

        var insertionAnchor =
            document.getElementById("language-selector-placeholder") ||
            document.getElementById("global-header-container");

        if (insertionAnchor && insertionAnchor.parentNode) {
            insertionAnchor.parentNode.insertBefore(root, insertionAnchor.nextElementSibling);
        } else {
            document.body.appendChild(root);
        }

        _promoRoot = root;
        var controller = { root: root, timerShow: null, timerHide: null, timerFade: null, dispose: disposePromo };
        window.__premiumPromoController = controller;

        function isCurrent() {
            return window.__premiumPromoController === controller && !!root.parentNode;
        }

        function disposePromo() {
            clearTimeout(controller.timerShow);
            clearTimeout(controller.timerHide);
            clearTimeout(controller.timerFade);
            window.removeEventListener("resize", positionPromo);
            if (root.parentNode) root.parentNode.removeChild(root);
            if (window.__premiumPromoController === controller) window.__premiumPromoController = null;
            if (_promoRoot === root) _promoRoot = null;
        }

        function scheduleNext(forceImmediate) {
            if (!isCurrent()) return;
            var remaining = forceImmediate
                ? INITIAL_DELAY_MS
                : INTERVAL_MS - (Date.now() - readLastShown());
            controller.timerShow = setTimeout(showPromo, Math.max(INITIAL_DELAY_MS, remaining));
        }

        function hidePromo() {
            if (!isCurrent()) return;
            clearTimeout(controller.timerHide);
            root.style.opacity = "0";
            root.style.pointerEvents = "none";
            controller.timerFade = setTimeout(function () {
                if (!isCurrent()) return;
                root.style.display = "none";
                scheduleNext(false);
            }, 180);
        }

        function showPromo() {
            if (!isCurrent()) return;
            if (!isPromoEligible()) {
                disposePromo();
                return;
            }
            writeLastShown();
            root.style.display = "block";
            root.style.pointerEvents = "auto";
            positionPromo();
            requestAnimationFrame(function () {
                if (isCurrent()) root.style.opacity = "1";
            });
            controller.timerHide = setTimeout(hidePromo, DISPLAY_MS);
        }

        window.addEventListener("resize", positionPromo);
        // Cada nova navegação para uma rota Premium exibe novamente o card,
        // mesmo que o usuário tenha acabado de vê-lo em outra página Premium.
        scheduleNext(isPremiumRoute());

        root.querySelector("[data-premium-promo-close]").addEventListener("click", function () {
            hidePromo();
        });
    }

    function _getRoot() {
        if (_root) return _root;
        _root = document.getElementById("premium-banner-root");
        if (!_root) {
            _root = document.createElement("div");
            _root.id = "premium-banner-root";
            document.body.insertBefore(_root, document.body.firstChild);
        }
        return _root;
    }

    function mount(opts) {
        opts = opts || {};
        // O manager exibe exclusivamente o banner promocional flutuante.
        // O antigo premiumCard/benefit-card não deve mais ser injetado abaixo do menu global.
        mountSubscriptionPromo();
        _mounted = true;
        if (window.AccessEvents) window.AccessEvents.emit(window.AccessEvents.EVENTS.BANNER_MOUNTED, opts);
    }

    function unmount() {
        if (_root) _root.innerHTML = "";
        _mounted = false;
    }

    function isMounted() {
        return _mounted;
    }

    window.AccessModules.bannerManager = {
        mount: mount,
        unmount: unmount,
        isMounted: isMounted,
        syncAds: syncAds
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindAuthGuards, { once: true });
    } else {
        bindAuthGuards();
    }

    console.log("[Access] Módulo premium-banner-manager.js carregado.");
})(window, document);
