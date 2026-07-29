/**
 * Reusable Terms & Conditions legal content (EN / HI / GU).
 * Natural phrasing per language — not machine-literal translations.
 */

import {
  SOFTWARE_OWNER_NAME,
  TERMS_EFFECTIVE_DATE,
  TERMS_JURISDICTION_PLACEHOLDER,
  TERMS_LAST_UPDATED,
  TERMS_VERSION,
} from './terms-consent';
import { APP_NAME } from '@/lib/app-branding';

export type TermsLang = 'en' | 'hi' | 'gu';

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  highlight?: boolean;
};

export type TermsFaq = { q: string; a: string };

export type TermsDocument = {
  langLabel: string;
  pageTitle: string;
  metaDescription: string;
  intro: string;
  readingTime: string;
  versionLabel: string;
  effectiveLabel: string;
  updatedLabel: string;
  warningTitle: string;
  warningBody: string;
  tocTitle: string;
  searchPlaceholder: string;
  faqTitle: string;
  backToTop: string;
  acceptCta: string;
  printHint: string;
  sections: TermsSection[];
  faq: TermsFaq[];
};

const owner = SOFTWARE_OWNER_NAME;
const app = APP_NAME;
const court = TERMS_JURISDICTION_PLACEHOLDER;

export const TERMS_META = {
  version: TERMS_VERSION,
  effectiveDate: TERMS_EFFECTIVE_DATE,
  lastUpdated: TERMS_LAST_UPDATED,
  owner,
  app,
  court,
};

export const TERMS_BY_LANG: Record<TermsLang, TermsDocument> = {
  en: {
    langLabel: 'EN',
    pageTitle: `Terms & Conditions — ${app}`,
    metaDescription: `Legal Terms & Conditions for ${app}: digital credit management and money-flow record keeping software for India.`,
    intro: `${app} is a digital record-keeping and internal management product for authorised users in India. These Terms govern your access to and use of the software. Please read them carefully before continuing.`,
    readingTime: 'Approx. 12–15 min read',
    versionLabel: 'Version',
    effectiveLabel: 'Effective date',
    updatedLabel: 'Last updated',
    warningTitle: 'Important notice',
    warningBody:
      'This software is only a digital management and record-keeping tool. The Developer does not participate in financial transactions, cash movement, fund transfer, money routing, business decisions, accounting verification, tax calculations, legal advice, investment, commission decisions, or customer verification. The software only stores information entered by authorised users. The Developer has no control over data entered by the Client or its users.',
    tocTitle: 'On this page',
    searchPlaceholder: 'Search terms…',
    faqTitle: 'Frequently asked questions',
    backToTop: 'Back to top',
    acceptCta: 'I understand these Terms',
    printHint: 'Print-friendly — use your browser Print dialog',
    sections: [
      {
        id: 'acceptance',
        title: '1. Acceptance of Terms',
        paragraphs: [
          `By accessing, installing, logging into, or otherwise using ${app}, you confirm that you are authorised by the Client organisation and that you have read, understood, and agree to be bound by these Terms & Conditions and any policies referenced herein.`,
          'If you do not agree, you must not use the software. Continued use after updates constitutes acceptance of the revised Terms when prompted.',
        ],
      },
      {
        id: 'nature-of-software',
        title: '2. Nature of the Software',
        highlight: true,
        paragraphs: [
          `${app} is Credit Management / Money Flow Tracking / Angadiya firm internal management software intended for digital record keeping within India.`,
          'The Developer provides a technology platform only. The Developer does not operate as a bank, NBFC, payment aggregator, money exchanger, remittance agent, accountant, auditor, tax advisor, or legal advisor.',
        ],
        bullets: [
          'No participation by the Developer in financial transactions',
          'No cash movement or fund transfer by the Developer',
          'No money routing or settlement by the Developer',
          'No business decisions, accounting verification, or tax calculations by the Developer',
          'No legal advice, investment advice, or commission decisions by the Developer',
          'No customer verification performed by the Developer',
          'Only storage and display of information entered by authorised users',
        ],
      },
      {
        id: 'client-responsibility',
        title: '3. Responsibility of the Client',
        paragraphs: [
          'The Client (the organisation or person who licenses or operates the software) is solely and exclusively responsible for all business, financial, operational, and legal aspects of its use of the software.',
        ],
        bullets: [
          'All data entered into the system and its accuracy, completeness, and authenticity',
          'Business operations, financial records, and internal approvals',
          'Government compliance including Income Tax, GST, accounting, audit, and business licences',
          'User management, passwords, access control, and role assignment',
          'Cash handling, customer verification, and day-to-day operational controls',
          'Compliance with all applicable laws of India',
        ],
      },
      {
        id: 'prohibited-use',
        title: '4. Unauthorised & Illegal Use',
        highlight: true,
        paragraphs: [
          'The software must never be used for any unlawful purpose. Entire responsibility for misuse remains with the Client and its users.',
        ],
        bullets: [
          'Illegal transactions of any kind',
          'Money laundering or terror financing',
          'Fraud, forgery, or tax evasion',
          'Hawala or similar prohibited arrangements outside applicable law',
          'Fake identities or impersonation',
          'Cyber crime or any activity prohibited under Indian law',
        ],
      },
      {
        id: 'security',
        title: '5. Cyber Security',
        paragraphs: [
          'The Developer follows reasonable security practices appropriate for a business software product. However, no software or online service is 100% secure.',
          'The Developer is not liable for incidents arising from circumstances beyond reasonable control or from user negligence.',
        ],
        bullets: [
          'Unknown zero-day vulnerabilities or state-sponsored attacks',
          'Weak passwords, shared credentials, or compromised devices',
          'Internet outages, power failures, hosting or cloud-provider downtime',
          'Natural disasters and other force majeure events',
        ],
      },
      {
        id: 'data-loss',
        title: '6. Data Loss & Availability',
        paragraphs: [
          'The Client is responsible for maintaining appropriate backups and operational continuity. The Developer is not responsible for data loss or unavailability arising from:',
        ],
        bullets: [
          'Improper or missing backups',
          'User deletion or accidental modification of records',
          'Virus attacks, hardware failure, or OS corruption',
          'Third-party hosting failure or internet interruption',
        ],
      },
      {
        id: 'liability',
        title: '7. Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted under the laws of the Republic of India, the Developer shall not be liable for any claim arising out of or related to the use of the software, including without limitation:',
        ],
        bullets: [
          'Direct, indirect, incidental, special, consequential, or punitive damages',
          'Business interruption, lost profits, lost revenue, or loss of customers',
          'Data corruption or loss of reputation',
        ],
      },
      {
        id: 'legal-requests',
        title: '8. Legal Requests & Lawful Cooperation',
        highlight: true,
        paragraphs: [
          'The Developer respects the laws of India. Where legally required through a valid legal process, the Developer may cooperate with courts, police, Cyber Crime Cell, government authorities, law enforcement, and regulatory authorities.',
          'Cooperation occurs only when the Developer is legally obligated. The Developer may provide available technical logs or information if required under applicable laws.',
          'The Developer will not disclose Client data without valid legal authority, except where disclosure is required by law.',
        ],
      },
      {
        id: 'ownership',
        title: '9. Data Ownership & Intellectual Property',
        paragraphs: [
          'The Client owns its business data entered into the software. The Developer owns all intellectual property in the software, including source code, architecture, UI/UX, design, algorithms, frameworks, and related IP.',
          'The Client receives a limited, non-exclusive right to use the software as licensed. No ownership of the software is transferred.',
        ],
      },
      {
        id: 'as-is',
        title: '10. Software Provided “AS IS”',
        paragraphs: [
          'The software is provided AS IS and WITHOUT WARRANTY of any kind, express or implied, to the fullest extent permitted by law. There is no guarantee of business success, profit, legal or tax compliance, 100% uptime, or error-free operation.',
        ],
      },
      {
        id: 'accounts',
        title: '11. User Accounts & Conduct',
        paragraphs: ['Authorised users must:'],
        bullets: [
          'Keep passwords secure and not share login credentials',
          'Not misuse the software or attempt to reverse engineer it',
          'Not exploit vulnerabilities or circumvent security controls',
        ],
      },
      {
        id: 'technical-abuse',
        title: '12. Prohibited Technical Activities',
        paragraphs: ['The following are strictly prohibited:'],
        bullets: [
          'Reverse engineering, bot attacks, API abuse, or brute force',
          'SQL injection, malware, tampering, or unauthorised access',
          'Data scraping or licence bypass',
        ],
      },
      {
        id: 'termination',
        title: '13. Suspension & Termination',
        paragraphs: [
          'The Developer may suspend access or support where reasonably necessary, including illegal use, licence violation, non-payment, security threats, or abuse.',
        ],
      },
      {
        id: 'modifications',
        title: '14. Modification of Terms',
        paragraphs: [
          `The Developer may update these Terms. When the Terms version changes, users may be required to accept the revised version before continued use of ${app}.`,
        ],
      },
      {
        id: 'privacy',
        title: '15. Privacy',
        paragraphs: [
          'The application stores business information entered by users for operational purposes. The Developer does not sell Client data and does not share it without authorisation, except for lawful disclosure as described in these Terms.',
        ],
      },
      {
        id: 'jurisdiction',
        title: '16. Governing Law & Jurisdiction',
        paragraphs: [
          'These Terms are governed by the laws of the Republic of India. Subject to applicable law, disputes shall be subject to the jurisdiction of the appropriate courts specified by the Software Owner:',
          court,
          `Software Owner / Developer: ${owner}.`,
        ],
      },
      {
        id: 'contact',
        title: '17. Contact',
        paragraphs: [
          `For questions about these Terms, contact the Software Owner: ${owner}, through the support channels published in the application (phone / WhatsApp on the home page).`,
        ],
      },
    ],
    faq: [
      {
        q: 'Does the Developer handle my money or transfers?',
        a: 'No. The software only records information entered by your authorised users. The Developer does not move funds or participate in transactions.',
      },
      {
        q: 'Who is responsible for GST / Income Tax compliance?',
        a: 'The Client alone. The software does not calculate or verify tax liability and is not a substitute for professional advice.',
      },
      {
        q: 'Will you share our data with third parties?',
        a: 'Not for sale or unauthorised sharing. Disclosure may occur only when legally required under Indian law through valid process.',
      },
      {
        q: 'What if Terms are updated?',
        a: 'A new version may require fresh acceptance. Until accepted, access may be limited as configured by the product.',
      },
    ],
  },

  hi: {
    langLabel: 'हिन्दी',
    pageTitle: `नियम और शर्तें — ${app}`,
    metaDescription: `${app} के लिए नियम और शर्तें: भारत में क्रेडिट प्रबंधन और धन प्रवाह रिकॉर्ड रखने वाला सॉफ़्टवेयर।`,
    intro: `${app} भारत में अधिकृत उपयोगकर्ताओं के लिए डिजिटल रिकॉर्ड-कीपिंग और आंतरिक प्रबंधन का उत्पाद है। ये नियम सॉफ़्टवेयर के उपयोग को नियंत्रित करते हैं। आगे बढ़ने से पहले इन्हें ध्यान से पढ़ें।`,
    readingTime: 'लगभग 12–15 मिनट का पढ़ना',
    versionLabel: 'संस्करण',
    effectiveLabel: 'प्रभावी तिथि',
    updatedLabel: 'अंतिम अद्यतन',
    warningTitle: 'महत्वपूर्ण सूचना',
    warningBody:
      'यह सॉफ़्टवेयर केवल डिजिटल प्रबंधन और रिकॉर्ड रखने का उपकरण है। डेवलपर वित्तीय लेन-देन, नकदी की आवाजाही, फंड ट्रांसफर, मनी राउटिंग, व्यावसायिक निर्णय, लेखांकन सत्यापन, कर गणना, कानूनी सलाह, निवेश, कमीशन निर्णय या ग्राहक सत्यापन में भाग नहीं लेता। सॉफ़्टवेयर केवल अधिकृत उपयोगकर्ताओं द्वारा दर्ज जानकारी संग्रहीत करता है। क्लाइंट या उसके उपयोगकर्ताओं द्वारा दर्ज डेटा पर डेवलपर का नियंत्रण नहीं है।',
    tocTitle: 'इस पृष्ठ पर',
    searchPlaceholder: 'खोजें…',
    faqTitle: 'अक्सर पूछे जाने वाले प्रश्न',
    backToTop: 'ऊपर जाएँ',
    acceptCta: 'मैं इन नियमों को समझता/समझती हूँ',
    printHint: 'प्रिंट के लिए ब्राउज़र का Print विकल्प उपयोग करें',
    sections: [
      {
        id: 'acceptance',
        title: '1. नियमों की स्वीकृति',
        paragraphs: [
          `${app} तक पहुँचने, इंस्टॉल करने, लॉगिन करने या अन्य किसी प्रकार से उपयोग करने पर आप पुष्टि करते हैं कि आप क्लाइंट संगठन द्वारा अधिकृत हैं तथा आपने ये नियम पढ़कर समझे हैं और उनसे बाध्य होने को सहमत हैं।`,
          'यदि आप सहमत नहीं हैं तो सॉफ़्टवेयर का उपयोग न करें। अद्यतन के बाद भी उपयोग जारी रखना, जब माँगा जाए तो संशोधित नियमों की स्वीकृति माना जाएगा।',
        ],
      },
      {
        id: 'nature-of-software',
        title: '2. सॉफ़्टवेयर की प्रकृति',
        highlight: true,
        paragraphs: [
          `${app} क्रेडिट प्रबंधन / मनी फ्लो ट्रैकिंग / अंगड़िया फर्म आंतरिक प्रबंधन के लिए डिजिटल रिकॉर्ड-कीपिंग सॉफ़्टवेयर है (भारत)।`,
          'डेवलपर केवल तकनीकी मंच प्रदान करता है। डेवलपर बैंक, NBFC, पेमेंट एग्रीगेटर, मनी एक्सचेंजर, एकाउंटेंट, ऑडिटर, कर सलाहकार या कानूनी सलाहकार के रूप में कार्य नहीं करता।',
        ],
        bullets: [
          'डेवलपर द्वारा किसी वित्तीय लेन-देन में भागीदारी नहीं',
          'नकदी आवाजाही या फंड ट्रांसफर नहीं',
          'मनी राउटिंग / सेटलमेंट नहीं',
          'व्यावसायिक निर्णय, लेखांकन सत्यापन या कर गणना नहीं',
          'कानूनी/निवेश सलाह या कमीशन निर्णय नहीं',
          'ग्राहक सत्यापन डेवलपर नहीं करता',
          'केवल अधिकृत उपयोगकर्ताओं द्वारा दर्ज जानकारी का भंडारण/प्रदर्शन',
        ],
      },
      {
        id: 'client-responsibility',
        title: '3. क्लाइंट की जिम्मेदारी',
        paragraphs: [
          'क्लाइंट (जो संगठन/व्यक्ति सॉफ़्टवेयर लाइसेंस करता या चलाता है) सॉफ़्टवेयर के उपयोग से जुड़े सभी व्यावसायिक, वित्तीय, परिचालन और कानूनी पहलुओं के लिए पूर्णतः स्वयं जिम्मेदार है।',
        ],
        bullets: [
          'सिस्टम में दर्ज समस्त डेटा तथा उसकी सटीकता, पूर्णता और प्रामाणिकता',
          'व्यावसायिक संचालन, वित्तीय रिकॉर्ड और आंतरिक अनुमोदन',
          'आयकर, GST, लेखांकन, ऑडिट और व्यावसायिक लाइसेंस सहित सरकारी अनुपालन',
          'उपयोगकर्ता प्रबंधन, पासवर्ड, पहुँच नियंत्रण और भूमिकाएँ',
          'नकदी प्रबंधन, ग्राहक सत्यापन और दैनिक नियंत्रण',
          'भारत के लागू कानूनों का अनुपालन',
        ],
      },
      {
        id: 'prohibited-use',
        title: '4. अनधिकृत व अवैध उपयोग',
        highlight: true,
        paragraphs: [
          'सॉफ़्टवेयर का उपयोग किसी अवैध उद्देश्य के लिए कभी नहीं किया जाना चाहिए। दुरुपयोग की पूरी जिम्मेदारी क्लाइंट और उसके उपयोगकर्ताओं की होगी।',
        ],
        bullets: [
          'किसी भी प्रकार के अवैध लेन-देन',
          'मनी लॉन्ड्रिंग या आतंक वित्तपोषण',
          'धोखाधड़ी, जालसाजी या कर चोरी',
          'लागू कानून के बाहर हवाला या समान व्यवस्थाएँ',
          'नकली पहचान या प्रतिरूपण',
          'साइबर अपराध अथवा भारत में निषिद्ध कोई भी गतिविधि',
        ],
      },
      {
        id: 'security',
        title: '5. साइबर सुरक्षा',
        paragraphs: [
          'डेवलपर व्यावसायिक सॉफ़्टवेयर के अनुरूप उचित सुरक्षा अभ्यास अपनाता है। फिर भी कोई सॉफ़्टवेयर 100% सुरक्षित नहीं होता।',
          'उपयोगकर्ता की लापरवाही या उचित नियंत्रण से बाहर की घटनाओं के लिए डेवलपर उत्तरदायी नहीं है।',
        ],
        bullets: [
          'अज्ञात ज़ीरो-डे या राज्य-प्रायोजित हमले',
          'कमज़ोर पासवर्ड, साझा क्रेडेंशियल या संक्रमित डिवाइस',
          'इंटरनेट/बिजली बाधा, होस्टिंग या क्लाउड डाउनटाइम',
          'प्राकृतिक आपदाएँ तथा अन्य अप्रत्याशित घटनाएँ (force majeure)',
        ],
      },
      {
        id: 'data-loss',
        title: '6. डेटा हानि और उपलब्धता',
        paragraphs: [
          'उचित बैकअप और निरंतरता क्लाइंट की जिम्मेदारी है। निम्नलिखित से होने वाली हानि/अनुपलब्धता के लिए डेवलपर जिम्मेदार नहीं:',
        ],
        bullets: [
          'अनुचित या अनुपस्थित बैकअप',
          'उपयोगकर्ता द्वारा रिकॉर्ड हटाना/गलती से बदलना',
          'वायरस, हार्डवेयर विफलता या OS क्षति',
          'थर्ड-पार्टी होस्टिंग विफलता या इंटरनेट बाधा',
        ],
      },
      {
        id: 'liability',
        title: '7. दायित्व की सीमा',
        paragraphs: [
          'भारत गणराज्य के कानूनों द्वारा अनुमत अधिकतम सीमा तक, सॉफ़्टवेयर के उपयोग से उत्पन्न किसी भी दावे के लिए डेवलपर उत्तरदायी नहीं होगा, जिसमें शामिल हैं:',
        ],
        bullets: [
          'प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक, विशेष, परिणामी या दंडात्मक क्षति',
          'व्यवसाय में रुकावट, लाभ/राजस्व हानि या ग्राहक हानि',
          'डेटा भ्रष्टाचार या प्रतिष्ठा की हानि',
        ],
      },
      {
        id: 'legal-requests',
        title: '8. कानूनी अनुरोध और सहयोग',
        highlight: true,
        paragraphs: [
          'डेवलपर भारतीय कानूनों का सम्मान करता है। वैध कानूनी प्रक्रिया के माध्यम से आवश्यक होने पर न्यायालय, पुलिस, साइबर क्राइम सेल, सरकारी/नियामक प्राधिकरणों से सहयोग किया जा सकता है।',
          'सहयोग केवल तभी जब कानूनी रूप से बाध्य हो। लागू कानून के तहत आवश्यक होने पर उपलब्ध तकनीकी लॉग/जानकारी दी जा सकती है।',
          'वैध कानूनी प्राधिकार के बिना क्लाइंट डेटा का प्रकटीकरण नहीं किया जाएगा, सिवाय जहाँ कानून द्वारा आवश्यक हो।',
        ],
      },
      {
        id: 'ownership',
        title: '9. डेटा स्वामित्व और बौद्धिक संपदा',
        paragraphs: [
          'सॉफ़्टवेयर में दर्ज व्यावसायिक डेटा क्लाइंट का है। सॉफ़्टवेयर की बौद्धिक संपदा (सोर्स कोड, आर्किटेक्चर, UI/UX, डिज़ाइन, एल्गोरिद्म, फ्रेमवर्क आदि) डेवलपर की है।',
          'क्लाइंट को लाइसेंस अनुसार सीमित, गैर-विशिष्ट उपयोग अधिकार मिलता है; सॉफ़्टवेयर का स्वामित्व हस्तांतरित नहीं होता।',
        ],
      },
      {
        id: 'as-is',
        title: '10. “जैसा है” आधार पर सॉफ़्टवेयर',
        paragraphs: [
          'सॉफ़्टवेयर AS IS तथा बिना किसी वारंटी के प्रदान किया जाता है। व्यावसायिक सफलता, लाभ, कानूनी/कर अनुपालन, 100% अपटाइम या त्रुटि-मुक्त संचालन की कोई गारंटी नहीं है।',
        ],
      },
      {
        id: 'accounts',
        title: '11. उपयोगकर्ता खाते और आचरण',
        paragraphs: ['अधिकृत उपयोगकर्ताओं को चाहिए:'],
        bullets: [
          'पासवर्ड सुरक्षित रखें; लॉगिन साझा न करें',
          'सॉफ़्टवेयर का दुरुपयोग या रिवर्स इंजीनियरिंग न करें',
          'कमजोरियों का शोषण या सुरक्षा नियंत्रण को बाईपास न करें',
        ],
      },
      {
        id: 'technical-abuse',
        title: '12. निषिद्ध तकनीकी गतिविधियाँ',
        paragraphs: ['निम्नलिखित सख्त रूप से निषिद्ध हैं:'],
        bullets: [
          'रिवर्स इंजीनियरिंग, बॉट अटैक, API दुरुपयोग, ब्रूट फोर्स',
          'SQL इंजेक्शन, मैलवेयर, छेड़छाड़, अनधिकृत पहुँच',
          'डेटा स्क्रैपिंग या लाइसेंस बाईपास',
        ],
      },
      {
        id: 'termination',
        title: '13. निलंबन और समाप्ति',
        paragraphs: [
          'अवैध उपयोग, लाइसेंस उल्लंघन, भुगतान न होना, सुरक्षा खतरा या दुरुपयोग की स्थिति में डेवलपर पहुँच/सहायता निलंबित कर सकता है।',
        ],
      },
      {
        id: 'modifications',
        title: '14. नियमों में परिवर्तन',
        paragraphs: [
          `डेवलपर ये नियम अद्यतन कर सकता है। संस्करण बदलने पर ${app} का उपयोग जारी रखने से पहले नई स्वीकृति आवश्यक हो सकती है।`,
        ],
      },
      {
        id: 'privacy',
        title: '15. गोपनीयता',
        paragraphs: [
          'एप्लिकेशन उपयोगकर्ताओं द्वारा दर्ज व्यावसायिक जानकारी परिचालन हेतु संग्रहीत करता है। डेवलपर क्लाइंट डेटा नहीं बेचता और अनधिकृत साझा नहीं करता; केवल इन नियमों में वर्णित वैध प्रकटीकरण संभव है।',
        ],
      },
      {
        id: 'jurisdiction',
        title: '16. लागू कानून और क्षेत्राधिकार',
        paragraphs: [
          'ये नियम भारत गणराज्य के कानूनों से शासित हैं। लागू कानून के अधीन विवाद सॉफ़्टवेयर स्वामी द्वारा निर्दिष्ट उपयुक्त न्यायालयों के क्षेत्राधिकार में होंगे:',
          court,
          `सॉफ़्टवेयर स्वामी / डेवलपर: ${owner}।`,
        ],
      },
      {
        id: 'contact',
        title: '17. संपर्क',
        paragraphs: [
          `इन नियमों संबंधी प्रश्नों के लिए सॉफ़्टवेयर स्वामी ${owner} से एप में प्रकाशित सहायता माध्यमों (होम पेज पर फोन / WhatsApp) के माध्यम से संपर्क करें।`,
        ],
      },
    ],
    faq: [
      {
        q: 'क्या डेवलपर मेरे पैसे या ट्रांसफर संभालता है?',
        a: 'नहीं। सॉफ़्टवेयर केवल आपके अधिकृत उपयोगकर्ताओं द्वारा दर्ज जानकारी रिकॉर्ड करता है। डेवलपर फंड नहीं भेजता और लेन-देन में भाग नहीं लेता।',
      },
      {
        q: 'GST / आयकर अनुपालन की जिम्मेदारी किसकी?',
        a: 'केवल क्लाइंट की। सॉफ़्टवेयर कर देयता की गणना/सत्यापन नहीं करता और पेशेवर सलाह का विकल्प नहीं है।',
      },
      {
        q: 'क्या हमारा डेटा तीसरे पक्ष से साझा होगा?',
        a: 'बेचने या अनधिकृत साझा करने के लिए नहीं। केवल भारतीय कानून के तहत वैध प्रक्रिया से आवश्यक होने पर प्रकटीकरण हो सकता है।',
      },
      {
        q: 'नियम अपडेट हों तो क्या होगा?',
        a: 'नए संस्करण के लिए दोबारा स्वीकृति माँगी जा सकती है। स्वीकृति तक पहुँच सीमित हो सकती है।',
      },
    ],
  },

  gu: {
    langLabel: 'ગુજરાતી',
    pageTitle: `નિયમો અને શરતો — ${app}`,
    metaDescription: `${app} માટેના નિયમો અને શરતો: ભારતમાં ક્રેડિટ મેનેજમેન્ટ અને મની ફ્લો રેકોર્ડ રાખવાનું સોફ્ટવેર.`,
    intro: `${app} ભારતમાં અધિકૃત વપરાશકર્તાઓ માટે ડિજિટલ રેકોર્ડ-કીપિંગ અને આંતરિક મેનેજમેન્ટ પ્રોડક્ટ છે. આ નિયમો સોફ્ટવેરના ઉપયોગને નિયંત્રિત કરે છે. આગળ વધતા પહેલાં કાળજીપૂર્વક વાંચો.`,
    readingTime: 'આશરે 12–15 મિનિટ વાંચન',
    versionLabel: 'વર્ઝન',
    effectiveLabel: 'અસરકારક તારીખ',
    updatedLabel: 'છેલ્લું અપડેટ',
    warningTitle: 'મહત્વની સૂચના',
    warningBody:
      'આ સોફ્ટવેર માત્ર ડિજિટલ મેનેજમેન્ટ અને રેકોર્ડ રાખવાનું સાધન છે. ડેવલપર નાણાકીય વ્યવહાર, રોકડની હેરફેર, ફંડ ટ્રાન્સફર, મની રાઉટિંગ, વ્યવસાયિક નિર્ણયો, એકાઉન્ટિંગ ચકાસણી, કર ગણતરી, કાનૂની સલાહ, રોકાણ, કમિશન નિર્ણયો કે ગ્રાહક ચકાસણીમાં ભાગ લેતા નથી. સોફ્ટવેર માત્ર અધિકૃત વપરાશકર્તાઓએ દાખલ કરેલી માહિતી સંગ્રહે છે. ક્લાયન્ટ કે તેના વપરાશકર્તાઓએ દાખલ કરેલા ડેટા પર ડેવલપરનું નિયંત્રણ નથી.',
    tocTitle: 'આ પેજ પર',
    searchPlaceholder: 'શોધો…',
    faqTitle: 'વારંવાર પૂછાતા પ્રશ્નો',
    backToTop: 'ઉપર જાઓ',
    acceptCta: 'હું આ નિયમો સમજું છું',
    printHint: 'પ્રિન્ટ માટે બ્રાઉઝરનો Print વિકલ્પ વાપરો',
    sections: [
      {
        id: 'acceptance',
        title: '1. નિયમોની સ્વીકૃતિ',
        paragraphs: [
          `${app} ઍક્સેસ કરવા, ઇન્સ્ટોલ કરવા, લોગિન કરવા કે અન્ય રીતે ઉપયોગ કરવાથી તમે પુષ્ટિ કરો છો કે તમે ક્લાયન્ટ સંસ્થા દ્વારા અધિકૃત છો અને આ નિયમો વાંચીને સમજ્યા છે તથા તેમને પાલન કરવા સંમત છો.`,
          'જો સંમત ન હોવ તો સોફ્ટવેરનો ઉપયોગ ન કરો. અપડેટ પછી ઉપયોગ ચાલુ રાખવો એ, જ્યારે માગવામાં આવે ત્યારે, સુધારેલા નિયમોની સ્વીકૃતિ ગણાશે.',
        ],
      },
      {
        id: 'nature-of-software',
        title: '2. સોફ્ટવેરની પ્રકૃતિ',
        highlight: true,
        paragraphs: [
          `${app} ક્રેડિટ મેનેજમેન્ટ / મની ફ્લો ટ્રેકિંગ / અંગડિયા ફર્મ આંતરિક મેનેજમેન્ટ માટેનું ડિજિટલ રેકોર્ડ-કીપિંગ સોફ્ટવેર છે (ભારત).`,
          'ડેવલપર માત્ર ટેક્નોલોજી પ્લેટફોર્મ આપે છે. ડેવલપર બેંક, NBFC, પેમેન્ટ એગ્રિગેટર, મની એક્સચેન્જર, એકાઉન્ટન્ટ, ઓડિટર, કર સલાહકાર કે કાનૂની સલાહકાર તરીકે કાર્ય કરતા નથી.',
        ],
        bullets: [
          'ડેવલપર દ્વારા નાણાકીય વ્યવહારમાં ભાગીદારી નહીં',
          'રોકડ હેરફેર કે ફંડ ટ્રાન્સફર નહીં',
          'મની રાઉટિંગ / સેટલમેન્ટ નહીં',
          'વ્યવસાયિક નિર્ણયો, એકાઉન્ટિંગ ચકાસણી કે કર ગણતરી નહીં',
          'કાનૂની/રોકાણ સલાહ કે કમિશન નિર્ણયો નહીં',
          'ગ્રાહક ચકાસણી ડેવલપર કરતા નથી',
          'માત્ર અધિકૃત વપરાશકર્તાઓએ દાખલ કરેલી માહિતીનો સંગ્રહ/ડિસ્પ્લે',
        ],
      },
      {
        id: 'client-responsibility',
        title: '3. ક્લાયન્ટની જવાબદારી',
        paragraphs: [
          'ક્લાયન્ટ (જે સંસ્થા/વ્યક્તિ સોફ્ટવેર લાઇસન્સ કરે કે ચલાવે) સોફ્ટવેરના ઉપયોગ સાથે જોડાયેલા તમામ વ્યવસાયિક, નાણાકીય, ઓપરેશનલ અને કાનૂની પાસાઓ માટે સંપૂર્ણપણે પોતે જવાબદાર છે.',
        ],
        bullets: [
          'સિસ્ટમમાં દાખલ થયેલો બધો ડેટા તથા તેની ચોકસાઈ, પૂર્ણતા અને પ્રામાણિકતા',
          'વ્યવસાયિક કામગીરી, નાણાકીય રેકોર્ડ અને આંતરિક મંજૂરીઓ',
          'આવકવેરો, GST, એકાઉન્ટિંગ, ઓડિટ અને વ્યવસાયિક લાઇસન્સ સહિત સરકારી પાલન',
          'વપરાશકર્તા મેનેજમેન્ટ, પાસવર્ડ, ઍક્સેસ કંટ્રોલ અને રોલ્સ',
          'રોકડ હેન્ડલિંગ, ગ્રાહક ચકાસણી અને રોજિંદા નિયંત્રણો',
          'ભારતના લાગુ કાયદાઓનું પાલન',
        ],
      },
      {
        id: 'prohibited-use',
        title: '4. અનધિકૃત અને ગેરકાયદેસર ઉપયોગ',
        highlight: true,
        paragraphs: [
          'સોફ્ટવેરનો ઉપયોગ કોઈપણ ગેરકાયદેસર હેતુ માટે ક્યારેય ન થવો જોઈએ. દુરુપયોગની સંપૂર્ણ જવાબદારી ક્લાયન્ટ અને તેના વપરાશકર્તાઓની રહેશે.',
        ],
        bullets: [
          'કોઈપણ પ્રકારના ગેરકાયદેસર વ્યવહાર',
          'મની લોન્ડરિંગ કે આતંકવાદી ફાઇનાન્સિંગ',
          'છેતરપિંડી, જાળસાજી કે કર ચોરી',
          'લાગુ કાયદા બહાર હવાલા કે સમાન વ્યવસ્થાઓ',
          'નકલી ઓળખ કે છદ્મવેશ',
          'સાયબર ક્રાઇમ અથવા ભારતમાં પ્રતિબંધિત કોઈપણ પ્રવૃત્તિ',
        ],
      },
      {
        id: 'security',
        title: '5. સાયબર સુરક્ષા',
        paragraphs: [
          'ડેવલપર વ્યવસાયિક સોફ્ટવેર માટે યોગ્ય સુરક્ષા પ્રથાઓ અનુસરે છે. છતાં કોઈ સોફ્ટવેર 100% સુરક્ષિત નથી.',
          'વપરાશકર્તાની બેદરકારી કે વાજબી નિયંત્રણથી બહારની ઘટનાઓ માટે ડેવલપર જવાબદાર નથી.',
        ],
        bullets: [
          'અજ્ઞાત ઝીરો-ડે કે રાજ્ય-પ્રાયોજિત હુમલા',
          'નબળા પાસવર્ડ, શેર થયેલ ક્રેડેન્શિયલ્સ કે કોમ્પ્રોમાઇઝ્ડ ડિવાઇસ',
          'ઇન્ટરનેટ/પાવર અવરોધ, હોસ્ટિંગ કે ક્લાઉડ ડાઉનટાઇમ',
          'કુદરતી આફતો અને અન્ય force majeure ઘટનાઓ',
        ],
      },
      {
        id: 'data-loss',
        title: '6. ડેટા નુકશાન અને ઉપલબ્ધતા',
        paragraphs: [
          'યોગ્ય બેકઅપ અને સાતત્ય ક્લાયન્ટની જવાબદારી છે. નીચેના કારણે નુકશાન/અનુપલબ્ધતા માટે ડેવલપર જવાબદાર નથી:',
        ],
        bullets: [
          'અયોગ્ય કે ગેરહાજર બેકઅપ',
          'વપરાશકર્તા દ્વારા રેકોર્ડ કાઢી નાખવા/ભૂલથી બદલવા',
          'વાયરસ, હાર્ડવેર નિષ્ફળતા કે OS ક્ષતિ',
          'થર્ડ-પાર્ટી હોસ્ટિંગ નિષ્ફળતા કે ઇન્ટરનેટ અવરોધ',
        ],
      },
      {
        id: 'liability',
        title: '7. જવાબદારીની મર્યાદા',
        paragraphs: [
          'ભારતીય ગણરાજ્યના કાયદા હેઠળ માન્ય મહત્તમ મર્યાદા સુધી, સોફ્ટવેરના ઉપયોગથી ઉદ્ભવતા કોઈપણ દાવા માટે ડેવલપર જવાબદાર રહેશે નહીં, જેમાં સમાવેશ થાય છે:',
        ],
        bullets: [
          'પ્રત્યક્ષ, પરોક્ષ, આકસ્મિક, વિશેષ, પરિણામી કે દંડાત્મક નુકસાન',
          'વ્યવસાયિક અવરોધ, નફો/આવકનું નુકશાન કે ગ્રાહક નુકશાન',
          'ડેટા ક્ષતિ કે પ્રતિષ્ઠાનું નુકશાન',
        ],
      },
      {
        id: 'legal-requests',
        title: '8. કાનૂની વિનંતીઓ અને સહકાર',
        highlight: true,
        paragraphs: [
          'ડેવલપર ભારતના કાયદાઓનું સન્માન કરે છે. માન્ય કાનૂની પ્રક્રિયા દ્વારા જરૂરી હોય ત્યારે કોર્ટ, પોલીસ, સાયબર ક્રાઇમ સેલ, સરકારી/નિયમનકારી સત્તામંડળો સાથે સહકાર આપી શકે.',
          'સહકાર માત્ર ત્યારે જ્યારે કાયદેસર રીતે બંધાયેલા હોય. લાગુ કાયદા હેઠળ જરૂરી હોય તો ઉપલબ્ધ ટેક્નિકલ લૉગ્સ/માહિતી આપી શકાય.',
          'માન્ય કાનૂની અધિકાર વગર ક્લાયન્ટ ડેટા જાહેર નહીં થાય, સિવાય કે કાયદા દ્વારા જરૂરી હોય.',
        ],
      },
      {
        id: 'ownership',
        title: '9. ડેટા માલિકી અને બૌદ્ધિક સંપત્તિ',
        paragraphs: [
          'સોફ્ટવેરમાં દાખલ થયેલ વ્યવસાયિક ડેટા ક્લાયન્ટનો છે. સોફ્ટવેરની બૌદ્ધિક સંપત્તિ (સોર્સ કોડ, આર્કિટેક્ચર, UI/UX, ડિઝાઇન, અલ્ગોરિધમ્સ, ફ્રેમવર્ક વગેરે) ડેવલપરની છે.',
          'ક્લાયન્ટને લાઇસન્સ મુજબ મર્યાદિત, બિન-વિશિષ્ટ ઉપયોગ અધિકાર મળે છે; સોફ્ટવેરની માલિકી ટ્રાન્સફર થતી નથી.',
        ],
      },
      {
        id: 'as-is',
        title: '10. “જેમ છે તેમ” આધારે સોફ્ટવેર',
        paragraphs: [
          'સોફ્ટવેર AS IS અને કોઈ વોરંટી વગર આપવામાં આવે છે. વ્યવસાયિક સફળતા, નફો, કાનૂની/કર પાલન, 100% અપટાઇમ કે ભૂલ-મુક્ત કામગીરીની કોઈ ગેરંટી નથી.',
        ],
      },
      {
        id: 'accounts',
        title: '11. યુઝર એકાઉન્ટ અને આચરણ',
        paragraphs: ['અધિકૃત વપરાશકર્તાઓએ:'],
        bullets: [
          'પાસવર્ડ સુરક્ષિત રાખવા; લોગિન શેર ન કરવું',
          'સોફ્ટવેરનો દુરુપયોગ કે રિવર્સ એન્જિનિયરિંગ ન કરવું',
          'નબળાઈઓનો લાભ લેવો કે સુરક્ષા નિયંત્રણ બાયપાસ ન કરવું',
        ],
      },
      {
        id: 'technical-abuse',
        title: '12. પ્રતિબંધિત ટેક્નિકલ પ્રવૃત્તિઓ',
        paragraphs: ['નીચેની બાબતો સખ્તાઈથી પ્રતિબંધિત છે:'],
        bullets: [
          'રિવર્સ એન્જિનિયરિંગ, બૉટ અટેક, API દુરુપયોગ, બ્રુટ ફોર્સ',
          'SQL ઇન્જેક્શન, માલવેર, ટેમ્પરિંગ, અનધિકૃત ઍક્સેસ',
          'ડેટા સ્ક્રેપિંગ કે લાઇસન્સ બાયપાસ',
        ],
      },
      {
        id: 'termination',
        title: '13. સસ્પેન્શન અને સમાપ્તિ',
        paragraphs: [
          'ગેરકાયદેસર ઉપયોગ, લાઇસન્સ ઉલ્લંઘન, બિન-ચુકવણી, સુરક્ષા ખતરો કે દુરુપયોગના કિસ્સામાં ડેવલપર ઍક્સેસ/સપોર્ટ સસ્પેન્ડ કરી શકે.',
        ],
      },
      {
        id: 'modifications',
        title: '14. નિયમોમાં ફેરફાર',
        paragraphs: [
          `ડેવલપર આ નિયમો અપડેટ કરી શકે. વર્ઝન બદલાય ત્યારે ${app}નો ઉપયોગ ચાલુ રાખતા પહેલાં નવી સ્વીકૃતિ જરૂરી થઈ શકે.`,
        ],
      },
      {
        id: 'privacy',
        title: '15. પ્રાઇવસી',
        paragraphs: [
          'એપ્લિકેશન વપરાશકર્તાઓએ દાખલ કરેલી વ્યવસાયિક માહિતી ઓપરેશન માટે સંગ્રહે છે. ડેવલપર ક્લાયન્ટ ડેટા વેચતા નથી અને અનધિકૃત શેર કરતા નથી; માત્ર આ નિયમોમાં વર્ણવેલ કાયદેસર જાહેરાત શક્ય છે.',
        ],
      },
      {
        id: 'jurisdiction',
        title: '16. લાગુ કાયદો અને અધિકારક્ષેત્ર',
        paragraphs: [
          'આ નિયમો ભારતીય ગણરાજ્યના કાયદાઓથી શાસિત છે. લાગુ કાયદા હેઠળ વિવાદો સોફ્ટવેર માલિક દ્વારા નિર્દિષ્ટ યોગ્ય કોર્ટ્સના અધિકારક્ષેત્રમાં આવશે:',
          court,
          `સોફ્ટવેર માલિક / ડેવલપર: ${owner}.`,
        ],
      },
      {
        id: 'contact',
        title: '17. સંપર્ક',
        paragraphs: [
          `આ નિયમો અંગેના પ્રશ્નો માટે સોફ્ટવેર માલિક ${owner}નો સંપર્ક એપમાં પ્રકાશિત સપોર્ટ ચેનલ્સ (હોમ પેજ પર ફોન / WhatsApp) દ્વારા કરો.`,
        ],
      },
    ],
    faq: [
      {
        q: 'શું ડેવલપર મારા પૈસા કે ટ્રાન્સફર હેન્ડલ કરે છે?',
        a: 'ના. સોફ્ટવેર માત્ર તમારા અધિકૃત વપરાશકર્તાઓએ દાખલ કરેલી માહિતી રેકોર્ડ કરે છે. ડેવલપર ફંડ મોવ કરતા નથી અને વ્યવહારમાં ભાગ લેતા નથી.',
      },
      {
        q: 'GST / આવકવેરાનું પાલન કોની જવાબદારી?',
        a: 'માત્ર ક્લાયન્ટની. સોફ્ટવેર કર જવાબદારીની ગણતરી/ચકાસણી કરતું નથી અને વ્યાવસાયિક સલાહનો વિકલ્પ નથી.',
      },
      {
        q: 'શું અમારો ડેટા ત્રીજા પક્ષ સાથે શેર થશે?',
        a: 'વેચાણ કે અનધિકૃત શેરિંગ માટે નહીં. માત્ર ભારતીય કાયદા હેઠળ માન્ય પ્રક્રિયાથી જરૂરી હોય ત્યારે જાહેરાત થઈ શકે.',
      },
      {
        q: 'નિયમો અપડેટ થાય તો શું?',
        a: 'નવા વર્ઝન માટે ફરીથી સ્વીકૃતિ માગી શકાય. સ્વીકૃતિ સુધી ઍક્સેસ મર્યાદિત થઈ શકે.',
      },
    ],
  },
};
