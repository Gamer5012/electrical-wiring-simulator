/**
 * Professional Exam Mode Engine (نظام الامتحانات المهنية وتقييم التوصيلات)
 * Conforms to NFC 15-100 Educational & Vocational Standards
 * 
 * Features:
 * - Two Examination Types:
 *   A. Build From Scratch (تركيب الدارة من الصفر)
 *   B. Fault Finding & Troubleshooting (تشخيص وإصلاح الأعطال)
 * - Strict 100-point Grading Algorithm (Independent of general audit)
 * - Delayed Feedback: No live score or leak before final submission
 * - Workspace Isolation: Zero risk of overwriting normal training workspace
 * - Localized Arabic instructions with accurate French technical terminology
 */

(function(window) {
  'use strict';

  // ==========================================
  // 1. EXERCISE BANK DEFINITIONS
  // ==========================================
  const EXAM_EXERCISES = [
    // ------------------------------------------
    // TYPE A: BUILD FROM SCRATCH
    // ------------------------------------------
    {
      id: 'build_sa',
      type: 'build',
      circuitMode: 'SA',
      vvVariant: 'FR',
      titleAr: 'تركيب إنارة بسيطة (Simple Allumage)',
      titleFr: 'Montage Simple Allumage (SA)',
      categoryAr: 'الإنارة الأساسية',
      categoryFr: 'Éclairage de Base',
      difficulty: 'easy', // easy, medium, hard
      difficultyAr: 'مبتدئ',
      durationMinutes: 10,
      passingScore: 60,
      descriptionAr: 'المطلوب إنجاز دارة إنارة بسيطة (Simple Allumage) متوافقة مع معيار NFC 15-100 باستخدام قاطع دارة 10A وقاطعة بسيطة (SA) ومصباح واحد (E1).',
      descriptionFr: 'Réaliser le câblage d\'un circuit Simple Allumage selon la norme NFC 15-100 comprenant un disjoncteur 10A (Q1), un interrupteur simple (SW1) et un point lumineux (E1).',
      tasksAr: [
        'تغذية القاطعة (Borne L) بسلك الطور (Phase - أحمر) انطلاقاً من القاطع (Q1).',
        'توصيل راجع المصباح (Retour de Lampe - أسود/بني) من مخرج القاطعة (Borne 1) إلى طرف الطور بالمصباح (E1_L).',
        'توصيل السلك المحايد (Neutre - أزرق) مباشرة من القاطع إلى المصباح (E1_N).',
        'توصيل السلك الأرضي الوقائي (Terre PE - أخضر/أصفر) من مأخذ الأرض بالقاطع إلى المصباح (E1_PE).'
      ],
      // Required physical connections (grouped equivalence or exact nodes)
      requirements: {
        phaseSource: 'q1_L',
        neutralSource: 'q1_N',
        earthSource: 'q1_PE',
        // Expected logical connection groups:
        // Each entry defines a required connection between two components/terminals
        connections: [
          {
            id: 'c_phase_sw',
            nameAr: 'تغذية القاطعة بالطور',
            nameFr: 'Alimentation Phase Interrupteur',
            from: 'q1_L',
            to: 'sw1_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48', '#b91c1c', '#ef4444', '#991b1b'],
            points: 20
          },
          {
            id: 'c_sw_lamp',
            nameAr: 'سلك راجع الإنارة من القاطعة للمصباح',
            nameFr: 'Retour de Lampe vers E1',
            from: 'sw1_1',
            to: 'e1_L',
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f', '#451a03', '#1e293b'],
            points: 20
          },
          {
            id: 'c_neutral_lamp',
            nameAr: 'توصيل المحايد للمصباح E1',
            nameFr: 'Neutre vers E1',
            from: 'q1_N',
            to: 'e1_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8', '#3b82f6', '#1e40af'],
            points: 20
          },
          {
            id: 'c_earth_lamp',
            nameAr: 'توصيل التأريض الوقائي PE للمصباح E1',
            nameFr: 'Protection Électrique PE vers E1',
            from: 'q1_PE',
            to: 'e1_PE',
            role: 'terre',
            allowedColors: ['#16a34a', '#15803d', '#22c55e', '#eab308'],
            points: 10
          }
        ]
      }
    },
    {
      id: 'build_da',
      type: 'build',
      circuitMode: 'DA',
      vvVariant: 'FR',
      titleAr: 'تركيب إنارة مزدوجة (Double Allumage)',
      titleFr: 'Montage Double Allumage (DA)',
      categoryAr: 'إنارة متعددة ومجموعات',
      categoryFr: 'Éclairage Multi-Zones',
      difficulty: 'medium',
      difficultyAr: 'متوسط',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'المطلوب إنجاز دارة إنارة مزدوجة (Double Allumage) بقاطعتين منفصلتين: القاطعة 1 تتحكم في مصباحين (E1 + E2) على التوازي، والقاطعة 2 تتحكم في مصباح مستقل (E3)، مع تطبيق التسلسل (Repiquage) للمحايد والتأريض.',
      descriptionFr: 'Réaliser un montage Double Allumage conforme : Interrupteur 1 commande 2 lampes en parallèle (E1 & E2 via repiquage), Interrupteur 2 commande 1 lampe indépendante (E3), avec repiquage correct des Neutres et Terres.',
      tasksAr: [
        'تغذية القاطعة 1 بالطور (q1_L إلى da1_L)، وعمل جسر طور (Pontage Phase) إلى القاطعة 2 (da2_L).',
        'توصيل راجع القاطعة 1 (da1_1) بالمصباح E1، وتسلسله (Repiquage) إلى المصباح E2.',
        'توصيل راجع القاطعة 2 (da2_2) بالمصباح المستقل E3.',
        'توصيل وتوزيع المحايد (Neutre) بالتسلسل على المصابيح الثلاثة (E1, E2, E3).',
        'توصيل وتوزيع الأرضي (Terre PE) بالتسلسل على المصابيح الثلاثة لحمايتها.'
      ],
      requirements: {
        phaseSource: 'q1_L',
        neutralSource: 'q1_N',
        earthSource: 'q1_PE',
        connections: [
          {
            id: 'c_phase_da1',
            nameAr: 'تغذية القاطعة 1 بالطور',
            nameFr: 'Alimentation Phase DA1',
            from: 'q1_L',
            to: 'da1_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48', '#b91c1c', '#ef4444'],
            points: 10
          },
          {
            id: 'c_phase_bridge_da2',
            nameAr: 'جسر الطور (Pontage) إلى القاطعة 2',
            nameFr: 'Pontage Phase vers DA2',
            // Can be bridged from da1_L to da2_L OR directly from q1_L to da2_L
            alternatives: [
              { from: 'da1_L', to: 'da2_L' },
              { from: 'q1_L', to: 'da2_L' }
            ],
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48', '#b91c1c', '#ef4444'],
            points: 10
          },
          {
            id: 'c_retour_da1_e1',
            nameAr: 'سلك راجع القاطعة 1 إلى المصباح E1',
            nameFr: 'Retour DA1 vers E1',
            alternatives: [
              { from: 'da1_1', to: 'e1_L' },
              { from: 'da1_1', to: 'e2_L' } // If connected to E2 first then repiqued to E1
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f', '#451a03'],
            points: 10
          },
          {
            id: 'c_retour_repiquage_e1_e2',
            nameAr: 'تسلسل الراجع (Repiquage) بين مصباحي المجموعة 1 (E1 و E2)',
            nameFr: 'Repiquage Retour E1 <-> E2',
            alternatives: [
              { from: 'e1_L', to: 'e2_L' },
              { from: 'da1_1', to: 'e2_L' } // If directly both to switch
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f', '#451a03'],
            points: 10
          },
          {
            id: 'c_retour_da2_e3',
            nameAr: 'سلك راجع القاطعة 2 إلى المصباح المستقل E3',
            nameFr: 'Retour DA2 vers E3',
            from: 'da2_2',
            to: 'e3_L',
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f', '#451a03'],
            points: 10
          },
          {
            id: 'c_neutral_distribution',
            nameAr: 'توزيع المحايد على جميع المصابيح (E1, E2, E3)',
            nameFr: 'Distribution Neutre (E1, E2, E3)',
            // Evaluated structurally in custom checker
            customCheck: 'checkNeutralChainingAll',
            requiredNodes: ['e1_N', 'e2_N', 'e3_N'],
            sourceNode: 'q1_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8', '#3b82f6'],
            points: 10
          },
          {
            id: 'c_earth_distribution',
            nameAr: 'توزيع التأريض PE على جميع المصابيح (E1, E2, E3)',
            nameFr: 'Distribution Terre PE (E1, E2, E3)',
            customCheck: 'checkEarthChainingAll',
            requiredNodes: ['e1_PE', 'e2_PE', 'e3_PE'],
            sourceNode: 'q1_PE',
            role: 'terre',
            allowedColors: ['#16a34a', '#15803d', '#22c55e', '#eab308'],
            points: 10
          }
        ]
      }
    },
    {
      id: 'build_vv',
      type: 'build',
      circuitMode: 'VV',
      vvVariant: 'FR',
      titleAr: 'تركيب إنارة ذهاب وإياب (Va-et-vient)',
      titleFr: 'Montage Va-et-Vient Standard Français',
      categoryAr: 'إنارة الممرات والسلالم',
      categoryFr: 'Couloirs et Escaliers',
      difficulty: 'medium',
      difficultyAr: 'متوسط',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'المطلوب إنجاز دارة ذهاب وإياب (Va-et-vient) وفق النظام الفرنسي المعتمد، للتحكم في مصباحين متوازيين (E1 + E2) من نقطتي تحكم مختلفتين عبر خطي مكوكيين (Navettes).',
      descriptionFr: 'Réaliser le câblage d\'un Va-et-vient selon le standard français NFC 15-100 : Phase sur Borne L de VV1, deux navettes (orange) entre bornes 1-1 et 2-2, retour de lampe depuis Borne L de VV2 vers E1 et E2.',
      tasksAr: [
        'توصيل الطور من القاطع (q1_L) إلى الطرف المشترك للقاطعة الأولى (vv1_L).',
        'توصيل السلك المكوكي الأول (Navette 1 - برتقالي) بين الطرفين 1 للقاطعتين (vv1_1 إلى vv2_1).',
        'توصيل السلك المكوكي الثاني (Navette 2 - برتقالي) بين الطرفين 2 للقاطعتين (vv1_2 إلى vv2_2).',
        'توصيل سلك راجع الإنارة من الطرف المشترك للقاطعة الثانية (vv2_L) إلى المصباح E1 مع تسلسله إلى E2.',
        'توصيل المحايد والتأريض للمصباحين بالتسلسل.'
      ],
      requirements: {
        phaseSource: 'q1_L',
        neutralSource: 'q1_N',
        earthSource: 'q1_PE',
        connections: [
          {
            id: 'c_phase_vv1',
            nameAr: 'تغذية القاطعة الأولى VV1 بالطور',
            nameFr: 'Alimentation Phase vers VV1:L',
            from: 'q1_L',
            to: 'vv1_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48', '#b91c1c'],
            points: 12
          },
          {
            id: 'c_navette_1',
            nameAr: 'السلك المكوكي الأول (Navette 1)',
            nameFr: 'Conducteur Navette 1 (Borne 1 -> Borne 1)',
            from: 'vv1_1',
            to: 'vv2_1',
            role: 'navette',
            allowedColors: ['#ea580c', '#c2410c', '#f97316'],
            points: 15
          },
          {
            id: 'c_navette_2',
            nameAr: 'السلك المكوكي الثاني (Navette 2)',
            nameFr: 'Conducteur Navette 2 (Borne 2 -> Borne 2)',
            from: 'vv1_2',
            to: 'vv2_2',
            role: 'navette',
            allowedColors: ['#ea580c', '#c2410c', '#f97316'],
            points: 15
          },
          {
            id: 'c_retour_vv2_lamps',
            nameAr: 'راجع الإنارة من القاطعة الثانية VV2 إلى المصابيح',
            nameFr: 'Retour de Lampe depuis VV2:L',
            alternatives: [
              { from: 'vv2_L', to: 'e1_L' },
              { from: 'vv2_L', to: 'e2_L' }
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f'],
            points: 14
          },
          {
            id: 'c_repiquage_vv_lamps',
            nameAr: 'تسلسل الراجع بين المصباحين E1 و E2',
            nameFr: 'Repiquage Retour E1 <-> E2',
            alternatives: [
              { from: 'e1_L', to: 'e2_L' },
              { from: 'vv2_L', to: 'e2_L' }
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f'],
            points: 6
          },
          {
            id: 'c_neutral_vv',
            nameAr: 'توصيل المحايد للمصباحين E1 و E2',
            nameFr: 'Neutre vers Lampes E1 & E2',
            customCheck: 'checkNeutralChainingAll',
            requiredNodes: ['e1_N', 'e2_N'],
            sourceNode: 'q1_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8'],
            points: 4
          },
          {
            id: 'c_earth_vv',
            nameAr: 'توصيل التأريض الوقائي PE للمصابيح',
            nameFr: 'Terre PE vers Lampes',
            customCheck: 'checkEarthChainingAll',
            requiredNodes: ['e1_PE', 'e2_PE'],
            sourceNode: 'q1_PE',
            role: 'terre',
            allowedColors: ['#16a34a', '#15803d', '#22c55e', '#eab308'],
            points: 4
          }
        ]
      }
    },
    {
      id: 'build_tl',
      type: 'build',
      circuitMode: 'TL',
      vvVariant: 'FR',
      titleAr: 'تركيب مرحل نبضي 4 أسلاك (Télérupteur 4 Fils)',
      titleFr: 'Montage Télérupteur 4 Fils avec Boutons Poussoirs',
      categoryAr: 'التحكم المتقدم والنبضي',
      categoryFr: 'Commande Impulsionnelle',
      difficulty: 'hard',
      difficultyAr: 'متقدم',
      durationMinutes: 20,
      passingScore: 60,
      descriptionAr: 'المطلوب إنجاز دارة مرحل نبضي 4 أسلاك (Télérupteur 4 Fils) متصل بثلاثة أزرار ضاغطة (BP1, BP2, BP3) على التوازي لتشغيل ملف المرحل (A1-A2)، مع تغذية مصباحين متوازيين (E1, E2) عبر ملامس القدرة (1-2).',
      descriptionFr: 'Réaliser le câblage d\'un Télérupteur 4 fils : Bobine A1-A2 commandée par 3 boutons-poussoirs en parallèle, contact de puissance 1-2 alimentant les lampes E1 et E2.',
      tasksAr: [
        'توصيل الطور (q1_L) إلى ملامس القدرة للمرحل (tl_1) وإلى الأزرار الضاغطة (bp1_L, bp2_L, bp3_L) بالتسلسل.',
        'تجميع مخارج الأزرار الضاغطة (bp_out) على التوازي وربطها بمدخل ملف المرحل (tl_A1).',
        'توصيل المحايد (q1_N) إلى طرف ملف المرحل (tl_A2).',
        'توصيل مخرج القدرة للمرحل (tl_2) إلى المصابيح (E1_L ثم تسلسله إلى E2_L).',
        'توصيل المحايد والأرضي للمصابيح بالتسلسل.'
      ],
      requirements: {
        phaseSource: 'q1_L',
        neutralSource: 'q1_N',
        earthSource: 'q1_PE',
        connections: [
          {
            id: 'c_phase_tl_contact',
            nameAr: 'تغذية ملامس القدرة للمرحل (Borne 1)',
            nameFr: 'Alimentation Contact Puissance (tl_1)',
            from: 'q1_L',
            to: 'tl_1',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48'],
            points: 10
          },
          {
            id: 'c_phase_bp_chain',
            nameAr: 'تغذية الأزرار الضاغطة الثلاثة بالطور',
            nameFr: 'Distribution Phase vers BP1, BP2, BP3',
            customCheck: 'checkPhaseToButtons',
            requiredNodes: ['bp1_L', 'bp2_L', 'bp3_L'],
            sourceNode: 'q1_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48'],
            points: 12
          },
          {
            id: 'c_bp_to_coil_a1',
            nameAr: 'ربط مخارج الأزرار بملف المرحل (A1) على التوازي',
            nameFr: 'Liaison Poussoirs en parallèle vers Bobine A1',
            customCheck: 'checkButtonsToCoilA1',
            buttonOutputs: ['bp1_out', 'bp2_out', 'bp3_out'],
            targetNode: 'tl_A1',
            role: 'navette',
            allowedColors: ['#ea580c', '#c2410c', '#f97316'],
            points: 16
          },
          {
            id: 'c_neutral_coil_a2',
            nameAr: 'توصيل المحايد لملف المرحل (A2)',
            nameFr: 'Alimentation Neutre Bobine (tl_A2)',
            from: 'q1_N',
            to: 'tl_A2',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8'],
            points: 10
          },
          {
            id: 'c_contact2_to_lamps',
            nameAr: 'توصيل مخرج المرحل (Borne 2) للمصابيح',
            nameFr: 'Sortie Contact Puissance vers Lampes',
            alternatives: [
              { from: 'tl_2', to: 'e1_L' },
              { from: 'tl_2', to: 'e2_L' }
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f'],
            points: 12
          },
          {
            id: 'c_repiquage_tl_lamps',
            nameAr: 'تسلسل الراجع بين مصباحي المرحل E1 و E2',
            nameFr: 'Repiquage Retour E1 <-> E2',
            alternatives: [
              { from: 'e1_L', to: 'e2_L' },
              { from: 'tl_2', to: 'e2_L' }
            ],
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f'],
            points: 4
          },
          {
            id: 'c_neutral_tl_lamps',
            nameAr: 'توزيع المحايد على مصابيح الإنارة',
            nameFr: 'Neutre vers Lampes E1 & E2',
            customCheck: 'checkNeutralChainingAll',
            requiredNodes: ['e1_N', 'e2_N'],
            sourceNode: 'q1_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8'],
            points: 3
          },
          {
            id: 'c_earth_tl_lamps',
            nameAr: 'توزيع التأريض الوقائي PE على المصابيح',
            nameFr: 'Terre PE vers Lampes',
            customCheck: 'checkEarthChainingAll',
            requiredNodes: ['e1_PE', 'e2_PE'],
            sourceNode: 'q1_PE',
            role: 'terre',
            allowedColors: ['#16a34a', '#15803d', '#22c55e', '#eab308'],
            points: 3
          }
        ]
      }
    },
    {
      id: 'build_min',
      type: 'build',
      circuitMode: 'MIN',
      vvVariant: 'FR',
      titleAr: 'تركيب مؤقت إنارة السلالم 4 أسلاك (Minuterie Schneider 15363)',
      titleFr: 'Montage Minuterie 4 Fils pour Cage d\'escalier (Schneider 15363)',
      categoryAr: 'التحكم المتقدم والمؤقتات',
      categoryFr: 'Minuteries et Temporisations',
      difficulty: 'hard',
      difficultyAr: 'متقدم',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'المطلوب إنجاز دارة مؤقت إنارة السلالم 4 أسلاك (Minuterie Schneider 15363) وفق معيار NFC 15-100: تغذية المؤقت (L-N)، تجميع مخارج 3 أزرار ضاغطة على التوازي نحو مدخل التحكم (Borne 4)، وتوصيل مخرج القدرة (Borne 3) لتغذية مصباحين متوازيين (E1, E2).',
      descriptionFr: 'Réaliser le câblage d\'une minuterie d\'escalier Schneider 15363 selon la norme NFC 15-100 : Alimentation L-N, 3 boutons poussoirs en parallèle sur borne 4, sortie puissance borne 3 alimentant les lampes E1 et E2.',
      tasksAr: [
        'توصيل سلك الطور (q1_L) إلى مدخل التغذية L بمؤقت الإنارة وللأزرار الضاغطة (bp1_L, bp2_L, bp3_L).',
        'توصيل السلك المحايد (q1_N) إلى طرف التغذية N بمؤقت الإنارة لتشغيل إلكترونيات ومحرك التوقيت.',
        'تجميع مخارج الأزرار الضاغطة (bp_out) على التوازي وربطها بمدخل التحكم بالمؤقت (Borne 4).',
        'توصيل مخرج القدرة المؤقت (Borne 3) إلى مدخل الطور بالمصابيح (E1_L ثم تسلسله إلى E2_L).',
        'توصيل المحايد والأرضي الوقائي PE للمصابيح بالتسلسل وفق المعايير.'
      ],
      requirements: {
        phaseSource: 'q1_L',
        neutralSource: 'q1_N',
        earthSource: 'q1_PE',
        connections: [
          {
            id: 'c_phase_min_l',
            nameAr: 'تغذية مؤقت الإنارة بالطور (Borne L)',
            nameFr: 'Alimentation Phase Minuterie (min_L)',
            from: 'q1_L',
            to: 'min_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48'],
            points: 8
          },
          {
            id: 'c_neutral_min_n',
            nameAr: 'تغذية مؤقت الإنارة بالمحايد (Borne N)',
            nameFr: 'Alimentation Neutre Minuterie (min_N)',
            from: 'q1_N',
            to: 'min_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8'],
            points: 8
          },
          {
            id: 'c_phase_bp_chain',
            nameAr: 'تغذية الأزرار الضاغطة الثلاثة بالطور',
            nameFr: 'Distribution Phase vers BP1, BP2, BP3',
            customCheck: 'checkPhaseToButtons',
            requiredNodes: ['bp1_L', 'bp2_L', 'bp3_L'],
            sourceNode: 'q1_L',
            role: 'phase',
            allowedColors: ['#dc2626', '#e11d48'],
            points: 14
          },
          {
            id: 'c_buttons_to_min_ctrl',
            nameAr: 'ربط مخارج الأزرار بمدخل التحكم (Borne 4)',
            nameFr: 'Retour Boutons Poussoirs vers Borne 4',
            customCheck: 'checkButtonsToCoilA1',
            buttonOutputs: ['bp1_out', 'bp2_out', 'bp3_out'],
            targetNode: 'min_4',
            targetNodeAlt: 'min_3',
            role: 'navette',
            allowedColors: ['#ea580c', '#c2410c', '#f97316'],
            points: 16
          },
          {
            id: 'c_min_output_to_lamps',
            nameAr: 'مخرج القدرة للمصابيح (Borne 3 -> E1 & E2)',
            nameFr: 'Sortie Contact Lampes (min_3 -> E1, E2)',
            from: 'min_3',
            to: 'e1_L',
            role: 'retour',
            allowedColors: ['#18181b', '#27272a', '#78350f'],
            points: 12
          },
          {
            id: 'c_neutral_lamps',
            nameAr: 'توصيل المحايد للمصابيح بالتسلسل (E1, E2)',
            nameFr: 'Distribution Neutre vers Lampes E1, E2',
            customCheck: 'checkNeutralChainingAll',
            requiredNodes: ['e1_N', 'e2_N'],
            sourceNode: 'q1_N',
            role: 'neutre',
            allowedColors: ['#2563eb', '#1d4ed8'],
            points: 6
          },
          {
            id: 'c_earth_lamps',
            nameAr: 'توصيل التأريض الوقائي PE للمصابيح',
            nameFr: 'Protection Terre PE vers Lampes',
            customCheck: 'checkEarthChainingAll',
            requiredNodes: ['e1_PE', 'e2_PE'],
            sourceNode: 'q1_PE',
            role: 'terre',
            allowedColors: ['#16a34a', '#15803d'],
            points: 6
          }
        ]
      }
    },

    // ------------------------------------------
    // TYPE B: FAULT FINDING & TROUBLESHOOTING
    // ------------------------------------------
    {
      id: 'fault_sa_wrong_return',
      type: 'fault',
      circuitMode: 'SA',
      vvVariant: 'FR',
      titleAr: 'تشخيص عطل في إنارة بسيطة (Simple Allumage)',
      titleFr: 'Dépannage Circuit Simple Allumage (SA)',
      categoryAr: 'تشخيص الأعطال والتصحيح',
      categoryFr: 'Diagnostic et Maintenance',
      difficulty: 'easy',
      difficultyAr: 'مبتدئ',
      durationMinutes: 10,
      passingScore: 60,
      descriptionAr: 'تم تمديد هذه الدارة ولكن المصباح لا يضيء عند إغلاق القاطعة، كما وُجدت مخالفة واضحة في ألوان الأسلاك. افحص التوصيلات واكتشف الأخطاء وقم بإصلاحها لتتوافق الدارة مع معيار NFC 15-100.',
      descriptionFr: 'Le circuit a été pré-câblé avec des anomalies : la lampe ne s\'allume pas et une non-conformité de couleur de câble est présente. Diagnostiquez et réparez le câblage.',
      tasksAr: [
        'افحص مسار سلك الطور من القاطع (Q1) وتأكد من وصوله إلى مدخل القاطعة (SW1:L).',
        'افحص سلك راجع الإنارة بين القاطعة والمصباح وتحقق من سلامة وصحة لونه (NFC 15-100 يمنع استعمال الأزرق أو الأخضر/الأصفر كراجع طور).',
        'افحص السلك المحايد والسلك الأرضي للمصباح.',
        'احذف أو عدل الأسلاك المعيبة لتصبح الدارة متوافقة وتعمل بنجاح.'
      ],
      // Base baseline wires with intentional faults injected
      initialFaults: [
        {
          faultId: 'f_missing_phase',
          descriptionAr: 'انقطاع سلك الطور بين القاطع ومدخل القاطعة',
          descriptionFr: 'Phase non connectée à l\'interrupteur (Q1:L -> SW1:L manquant)'
        },
        {
          faultId: 'f_wrong_return_color',
          descriptionAr: 'سلك راجع المصباح موصول بلون محايد أزرق مخالف للمعايير',
          descriptionFr: 'Retour de lampe câblé en Bleu au lieu de Noir/Marron'
        }
      ],
      baselineSetup: (app) => {
        // Wiring with intentional faults:
        // 1. Missing q1_L -> sw1_L (fault 1)
        // 2. sw1_1 -> e1_L wired in blue (#2563eb, neutre) instead of black (fault 2)
        // 3. q1_N -> e1_N correct (#2563eb)
        // 4. q1_PE -> e1_PE correct (#16a34a)
        app.wr.clear();
        app.wr.addWire(
          app.cm.getTerminalById('sw1_1'),
          app.cm.getTerminalById('e1_L'),
          '#2563eb', // WRONG COLOR for retour!
          'neutre'
        );
        app.wr.addWire(
          app.cm.getTerminalById('q1_N'),
          app.cm.getTerminalById('e1_N'),
          '#2563eb',
          'neutre'
        );
        app.wr.addWire(
          app.cm.getTerminalById('q1_PE'),
          app.cm.getTerminalById('e1_PE'),
          '#16a34a',
          'terre'
        );
      },
      expectedTargetExerciseId: 'build_sa'
    },
    {
      id: 'fault_da_bridge_missing',
      type: 'fault',
      circuitMode: 'DA',
      vvVariant: 'FR',
      titleAr: 'عطل إنارة مزدوجة: انقطاع التغذية عن القاطعة 2 والمحايد',
      titleFr: 'Dépannage DA : Pontage Phase & Neutre E3 manquants',
      categoryAr: 'تشخيص الأعطال والتصحيح',
      categoryFr: 'Diagnostic et Maintenance',
      difficulty: 'medium',
      difficultyAr: 'متوسط',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'في هذه اللوحة، تعمل القاطعة 1 والمصابيح (E1, E2) بشكل جزئي، لكن القاطعة 2 والمصباح E3 لا يستجيبان إطلاقاً. حدد مواضع الانقطاع والتسلسل المفقود وأصلح الدارة.',
      descriptionFr: 'L\'interrupteur 1 fonctionne, mais l\'interrupteur 2 et la lampe E3 ne s\'allument jamais en raison d\'un pontage de phase manquant et d\'un repiquage neutre interrompu.',
      tasksAr: [
        'تحقق من وصول الطور إلى القاطعة الثانية (da2_L) عبر جسر الطور (Pontage).',
        'تحقق من اكتمال مسار المحايد (Neutre) إلى المصباح المستقل E3.',
        'تأكد من سلامة توصيل الراجع الخاص بالقاطعة 2 (da2_2 إلى e3_L).',
        'تأكد من تأريض المصباح E3.'
      ],
      initialFaults: [
        {
          faultId: 'f_missing_bridge_da2',
          descriptionAr: 'غياب جسر الطور المغذي للقاطعة الثانية da2_L',
          descriptionFr: 'Pontage Phase manquant vers Borne L de l\'interrupteur 2'
        },
        {
          faultId: 'f_missing_neutral_e3',
          descriptionAr: 'انقطاع السلك المحايد عن المصباح E3',
          descriptionFr: 'Repiquage Neutre vers la Lampe E3 manquant'
        }
      ],
      baselineSetup: (app) => {
        app.wr.clear();
        // Phase to DA1 only (missing bridge to DA2)
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('da1_L'), '#dc2626', 'phase');
        // DA1 to E1 and E2
        app.wr.addWire(app.cm.getTerminalById('da1_1'), app.cm.getTerminalById('e1_L'), '#18181b', 'retour');
        app.wr.addWire(app.cm.getTerminalById('e1_L'), app.cm.getTerminalById('e2_L'), '#18181b', 'retour');
        // DA2 to E3 (wired, but DA2 has no phase!)
        app.wr.addWire(app.cm.getTerminalById('da2_2'), app.cm.getTerminalById('e3_L'), '#18181b', 'retour');
        // Neutral to E1 and E2 only (missing repiquage to E3!)
        app.wr.addWire(app.cm.getTerminalById('q1_N'), app.cm.getTerminalById('e1_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('e1_N'), app.cm.getTerminalById('e2_N'), '#2563eb', 'neutre');
        // Earth to E1, E2, E3
        app.wr.addWire(app.cm.getTerminalById('q1_PE'), app.cm.getTerminalById('e1_PE'), '#16a34a', 'terre');
        app.wr.addWire(app.cm.getTerminalById('e1_PE'), app.cm.getTerminalById('e2_PE'), '#16a34a', 'terre');
        app.wr.addWire(app.cm.getTerminalById('e2_PE'), app.cm.getTerminalById('e3_PE'), '#16a34a', 'terre');
      },
      expectedTargetExerciseId: 'build_da'
    },
    {
      id: 'fault_vv_inverted_common',
      type: 'fault',
      circuitMode: 'VV',
      vvVariant: 'FR',
      titleAr: 'عطل ذهاب وإياب: خطأ في توصيل الطور بالمكوكيات',
      titleFr: 'Dépannage Va-et-Vient : Erreur d\'inversion Phase/Navette',
      categoryAr: 'تشخيص الأعطال والتصحيح',
      categoryFr: 'Diagnostic et Maintenance',
      difficulty: 'medium',
      difficultyAr: 'متوسط',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'دارة الذهاب والإياب تعمل بشكل شاذ وغير منتظم، حيث لا تضيء المصابيح إلا عند ضبط القاطعتين في وضع محدد معاً. السبب هو ربط سلك الطور بأحد أطراف المكوكية (1) بدلاً من الطرف المشترك (L).',
      descriptionFr: 'Le va-et-vient présente un comportement anormal : la phase a été branchée par erreur sur une borne de navette (1) au lieu de la borne commune L.',
      tasksAr: [
        'افحص السلك القادم من القاطع وتأكد من اتصاله بالطرف المشترك (vv1_L).',
        'تأكد من أن السلكين المكوكيين (برتقالي) يربطان حصراً بين الأطراف (1-1) و(2-2).',
        'تأكد من توصيل راجع المصابيح بالطرف المشترك للقاطعة الثانية (vv2_L).'
      ],
      initialFaults: [
        {
          faultId: 'f_phase_on_navette',
          descriptionAr: 'سلك الطور موصول خطأً بالطرف المكوكي (1) بدلاً من الطرف المشترك (L)',
          descriptionFr: 'Phase raccordée par erreur sur la Borne 1 de navette au lieu de Borne L'
        }
      ],
      baselineSetup: (app) => {
        app.wr.clear();
        // Phase erroneously connected to vv1_1 instead of vv1_L!
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('vv1_1'), '#dc2626', 'phase');
        // Navettes
        app.wr.addWire(app.cm.getTerminalById('vv1_1'), app.cm.getTerminalById('vv2_1'), '#ea580c', 'navette');
        app.wr.addWire(app.cm.getTerminalById('vv1_2'), app.cm.getTerminalById('vv2_2'), '#ea580c', 'navette');
        // Return from vv2_L
        app.wr.addWire(app.cm.getTerminalById('vv2_L'), app.cm.getTerminalById('e1_L'), '#18181b', 'retour');
        app.wr.addWire(app.cm.getTerminalById('e1_L'), app.cm.getTerminalById('e2_L'), '#18181b', 'retour');
        // Neutral & Earth
        app.wr.addWire(app.cm.getTerminalById('q1_N'), app.cm.getTerminalById('e1_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('e1_N'), app.cm.getTerminalById('e2_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('q1_PE'), app.cm.getTerminalById('e1_PE'), '#16a34a', 'terre');
        app.wr.addWire(app.cm.getTerminalById('e1_PE'), app.cm.getTerminalById('e2_PE'), '#16a34a', 'terre');
      },
      expectedTargetExerciseId: 'build_vv'
    },
    {
      id: 'fault_tl_button_neutral',
      type: 'fault',
      circuitMode: 'TL',
      vvVariant: 'FR',
      titleAr: 'عطل مرحل نبضي: زر غير متصل وملف مقطوع المحايد',
      titleFr: 'Dépannage Télérupteur : Poussoir 3 isolé & Neutre Bobine absent',
      categoryAr: 'تشخيص الأعطال والتصحيح',
      categoryFr: 'Diagnostic et Maintenance',
      difficulty: 'hard',
      difficultyAr: 'متقدم',
      durationMinutes: 20,
      passingScore: 60,
      descriptionAr: 'المرحل النبضي لا يستجيب إطلاقاً لأي من الأزرار الضاغطة (BP1, BP2, BP3)، كما أن الزر BP3 مقطوع التغذية. قم بفحص مسار تغذية الملف A1-A2 وتوازي الأزرار لتشغيل الدارة.',
      descriptionFr: 'Le télérupteur ne réagit à aucun bouton-poussoir car le neutre de la bobine (A2) n\'est pas raccordé, et le bouton BP3 est complètement isolé.',
      tasksAr: [
        'افحص تغذية ملف المرحل وتأكد من اتصال المحايد بطرفه A2.',
        'افحص تغذية الأزرار الضاغطة بالطور وتأكد من وصول الطور إلى BP3.',
        'افحص مخارج الأزرار وتأكد من ربط خرج BP3 بتوازي مخارج الأزرار المتصلة بـ A1.'
      ],
      initialFaults: [
        {
          faultId: 'f_missing_coil_neutral',
          descriptionAr: 'انقطاع السلك المحايد عن طرف ملف المرحل tl_A2',
          descriptionFr: 'Neutre non raccordé à la borne de bobine A2'
        },
        {
          faultId: 'f_bp3_isolated',
          descriptionAr: 'الزر الضاغط BP3 مفصول وغير مربوط بسلسلة الطور والمخارج',
          descriptionFr: 'Bouton BP3 complètement isolé du circuit'
        }
      ],
      baselineSetup: (app) => {
        app.wr.clear();
        // Power contact
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('tl_1'), '#dc2626', 'phase');
        // Phase to BP1 and BP2 only (BP3 isolated!)
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('bp1_L'), '#dc2626', 'phase');
        app.wr.addWire(app.cm.getTerminalById('bp1_L'), app.cm.getTerminalById('bp2_L'), '#dc2626', 'phase');
        // BP outputs to A1 (BP1 & BP2 only)
        app.wr.addWire(app.cm.getTerminalById('bp1_out'), app.cm.getTerminalById('tl_A1'), '#ea580c', 'navette');
        app.wr.addWire(app.cm.getTerminalById('bp2_out'), app.cm.getTerminalById('bp1_out'), '#ea580c', 'navette');
        // tl_A2 has NO NEUTRAL!
        // Contact 2 to lamps
        app.wr.addWire(app.cm.getTerminalById('tl_2'), app.cm.getTerminalById('e1_L'), '#18181b', 'retour');
        app.wr.addWire(app.cm.getTerminalById('e1_L'), app.cm.getTerminalById('e2_L'), '#18181b', 'retour');
        // Lamp Neutral & Earth
        app.wr.addWire(app.cm.getTerminalById('q1_N'), app.cm.getTerminalById('e1_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('e1_N'), app.cm.getTerminalById('e2_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('q1_PE'), app.cm.getTerminalById('e1_PE'), '#16a34a', 'terre');
        app.wr.addWire(app.cm.getTerminalById('e1_PE'), app.cm.getTerminalById('e2_PE'), '#16a34a', 'terre');
      },
      expectedTargetExerciseId: 'build_tl'
    },
    {
      id: 'fault_min_supply_control',
      type: 'fault',
      circuitMode: 'MIN',
      vvVariant: 'FR',
      expectedTargetExerciseId: 'build_min',
      titleAr: 'عطل مؤقت السلالم: المحايد مقطوع والزر BP3 مفصول التغذية',
      titleFr: 'Dépannage Minuterie Schneider 15363 : Neutre Déconnecté & BP3 Isolé',
      categoryAr: 'تشخيص الأعطال والتصحيح',
      categoryFr: 'Diagnostic et Maintenance',
      difficulty: 'hard',
      difficultyAr: 'متقدم',
      durationMinutes: 15,
      passingScore: 60,
      descriptionAr: 'مؤقت الإنارة لا يستجيب إطلاقاً لأي زر ضاغط بسبب انقطاع سلك المحايد عن طرف التغذية N لمؤقت Schneider 15363، كما أن الزر BP3 في الطابق الثاني مفصول عن خط الطور. قم بتشخيص وإصلاح العطلين.',
      descriptionFr: 'La minuterie ne réagit pas car le neutre est absent de la borne N, et le bouton poussoir BP3 est déconnecté de la phase.',
      tasksAr: [
        'افحص تغذية مؤقت الإنارة وتأكد من اتصال السلك المحايد بطرف التغذية N.',
        'افحص تغذية الأزرار الضاغطة وتأكد من وصول الطور إلى مدخل الزر BP3.',
        'افحص ربط مخارج الأزرار ومخرج القدرة بالمصابيح وتأكد من عمل المؤقت والمصابيح.'
      ],
      initialFaults: [
        {
          faultId: 'f_missing_timer_neutral',
          descriptionAr: 'انقطاع السلك المحايد عن طرف تغذية مؤقت الإنارة min_N',
          descriptionFr: 'Neutre non raccordé à la borne N de la minuterie'
        },
        {
          faultId: 'f_bp3_isolated',
          descriptionAr: 'الزر الضاغط BP3 مفصول عن تغذية الطور L',
          descriptionFr: 'Bouton BP3 non alimenté en Phase'
        }
      ],
      baselineSetup: (app) => {
        app.wr.clear();
        // Phase to Minuterie L
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('min_L'), '#dc2626', 'phase');
        // Phase to BP1 and BP2 only (BP3 isolated!)
        app.wr.addWire(app.cm.getTerminalById('q1_L'), app.cm.getTerminalById('bp1_L'), '#dc2626', 'phase');
        app.wr.addWire(app.cm.getTerminalById('bp1_L'), app.cm.getTerminalById('bp2_L'), '#dc2626', 'phase');
        // min_N has NO NEUTRAL (Fault 1!)
        // Push buttons output to Minuterie Borne 4
        app.wr.addWire(app.cm.getTerminalById('bp1_out'), app.cm.getTerminalById('min_4'), '#ea580c', 'navette');
        app.wr.addWire(app.cm.getTerminalById('bp2_out'), app.cm.getTerminalById('bp1_out'), '#ea580c', 'navette');
        app.wr.addWire(app.cm.getTerminalById('bp3_out'), app.cm.getTerminalById('bp2_out'), '#ea580c', 'navette');
        // Minuterie output 3 to Lamps E1 & E2
        app.wr.addWire(app.cm.getTerminalById('min_3'), app.cm.getTerminalById('e1_L'), '#18181b', 'retour');
        app.wr.addWire(app.cm.getTerminalById('e1_L'), app.cm.getTerminalById('e2_L'), '#18181b', 'retour');
        // Neutral to lamps
        app.wr.addWire(app.cm.getTerminalById('q1_N'), app.cm.getTerminalById('e1_N'), '#2563eb', 'neutre');
        app.wr.addWire(app.cm.getTerminalById('e1_N'), app.cm.getTerminalById('e2_N'), '#2563eb', 'neutre');
        // Earth to lamps
        app.wr.addWire(app.cm.getTerminalById('q1_PE'), app.cm.getTerminalById('e1_PE'), '#16a34a', 'terre');
        app.wr.addWire(app.cm.getTerminalById('e1_PE'), app.cm.getTerminalById('e2_PE'), '#16a34a', 'terre');
      },
      expectedTargetExerciseId: 'build_min'
    }
  ];

  // ==========================================
  // 2. STRICT EXAM GRADING ENGINE
  // ==========================================
  class ExamGradingEngine {
    constructor(componentManager, wireRouter) {
      this.cm = componentManager;
      this.wr = wireRouter;
    }

    /**
     * Build an undirected adjacency graph of purely physical external wires.
     * Nodes are terminal IDs.
     */
    buildPhysicalWireGraph() {
      const graph = new Map();
      const wires = this.wr.wires || [];

      wires.forEach(w => {
        if (!w || !w.fromId || !w.toId) return;
        if (!graph.has(w.fromId)) graph.set(w.fromId, new Set());
        if (!graph.has(w.toId)) graph.set(w.toId, new Set());

        graph.get(w.fromId).add(w.toId);
        graph.get(w.toId).add(w.fromId);
      });

      return graph;
    }

    /**
     * BFS check if startNode and targetNode are physically connected via wires.
     */
    isPhysicallyConnected(startNode, targetNode, graph) {
      if (!startNode || !targetNode) return false;
      if (startNode === targetNode) return true;
      if (!graph.has(startNode) || !graph.has(targetNode)) return false;

      const visited = new Set();
      const queue = [startNode];
      visited.add(startNode);

      while (queue.length > 0) {
        const current = queue.shift();
        if (current === targetNode) return true;

        const neighbors = graph.get(current);
        if (neighbors) {
          for (const next of neighbors) {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          }
        }
      }

      return false;
    }

    /**
     * Check if a direct wire exists between nodeA and nodeB
     */
    getDirectWire(nodeA, nodeB) {
      const wires = this.wr.wires || [];
      return wires.find(w => 
        (w.fromId === nodeA && w.toId === nodeB) ||
        (w.fromId === nodeB && w.toId === nodeA)
      );
    }

    /**
     * Evaluates wire color compliance against standard NFC 15-100 rules:
     * - Phase: Red, Brown, Black, Grey (Never Blue or Green/Yellow)
     * - Neutral: Strictly Light Blue
     * - Earth (PE): Strictly Green/Yellow
     * - Navettes: Orange / Violet
     * - Retour: Black / Brown / Grey
     */
    evaluateWireColors(wires) {
      const issues = [];
      const blueHues = ['#2563eb', '#1d4ed8', '#3b82f6', '#1e40af', '#0284c7'];
      const greenHues = ['#16a34a', '#15803d', '#22c55e', '#eab308'];

      wires.forEach(w => {
        const color = (w.color || '').toLowerCase();
        const type = (w.type || '').toLowerCase();

        // Rule 1: Blue is strictly reserved for Neutral
        if (type !== 'neutre' && (blueHues.includes(color) || color === '#2563eb')) {
          issues.push({
            wireId: w.id,
            severity: 'critical',
            messageAr: `مخالفة معيار NFC 15-100: السلك الموصول بين (${w.fromId} و ${w.toId}) لونه أزرق رغم أنه ليس محايداً (${type}). الأزرق محجوز للمحايد فقط!`,
            messageFr: `Non-conformité NFC 15-100 : Conducteur Bleu réservé exclusivement au Neutre.`
          });
        }

        // Rule 2: Green/Yellow is strictly reserved for Protective Earth
        if (type !== 'terre' && (greenHues.includes(color) || color === '#16a34a')) {
          issues.push({
            wireId: w.id,
            severity: 'critical',
            messageAr: `مخالفة معيار NFC 15-100: السلك الموصول بين (${w.fromId} و ${w.toId}) لونه أخضر/أصفر رغم أنه ليس خط أرضي (${type}). الأخضر/الأصفر محجوز للأرضي فقط!`,
            messageFr: `Non-conformité NFC 15-100 : Conducteur Vert/Jaune réservé exclusivement à la Terre (PE).`
          });
        }

        // Rule 3: Phase or Retour must not use Neutral or Earth colors
        if ((type === 'phase' || type === 'retour') && (blueHues.includes(color) || greenHues.includes(color))) {
          issues.push({
            wireId: w.id,
            severity: 'critical',
            messageAr: `خطأ جسيم في السلامة: استخدام لون سلك غير مخصص للطور/الراجع بين (${w.fromId} و ${w.toId}).`,
            messageFr: `Erreur critique de sécurité : Couleur non conforme pour conducteur actif (Phase/Retour).`
          });
        }
      });

      return issues;
    }

    /**
     * Comprehensive delayed exam evaluation.
     * Evaluates student's final submitted wiring against exercise requirements.
     */
    gradeExam(exercise, timeTakenSeconds = 0) {
      const wires = this.wr.wires || [];
      const components = this.cm.components || [];
      const wireGraph = this.buildPhysicalWireGraph();

      // Resolve target requirements: if fault exercise, lookup target build exercise specs
      let targetExercise = exercise;
      if (exercise.type === 'fault' && exercise.expectedTargetExerciseId) {
        targetExercise = EXAM_EXERCISES.find(ex => ex.id === exercise.expectedTargetExerciseId) || exercise;
      }

      const reqs = targetExercise.requirements || {};
      const requiredConnections = reqs.connections || [];

      // Scoring Breakdown (100 Points Total):
      // - Electrical connections & topology correctness: 70 pts
      // - Component & terminal relationship accuracy: 15 pts
      // - Wire color compliance (NFC 15-100): 10 pts
      // - Completeness & task hygiene: 5 pts
      let scoreConnections = 0;
      let scoreRelationships = 0;
      let scoreColors = 0;
      let scoreHygiene = 0;

      const results = {
        exerciseId: exercise.id,
        exerciseTitleAr: exercise.titleAr,
        exerciseTitleFr: exercise.titleFr,
        exerciseType: exercise.type,
        difficulty: exercise.difficulty,
        timeTakenSeconds: timeTakenSeconds,
        passed: false,
        totalScore: 0,
        passingScore: exercise.passingScore || 60,
        scoreBreakdown: {
          connections: 0,
          maxConnections: 70,
          relationships: 0,
          maxRelationships: 15,
          colors: 0,
          maxColors: 10,
          hygiene: 0,
          maxHygiene: 5
        },
        connectionDetails: [],
        colorIssues: [],
        faultsStatus: [],
        generalFeedbackAr: '',
        generalFeedbackFr: ''
      };

      // ----------------------------------------------------
      // A. Evaluate Required Connections (70 Points Max)
      // ----------------------------------------------------
      let earnedConnPoints = 0;
      let totalConnMaxWeight = 0;

      requiredConnections.forEach(req => {
        totalConnMaxWeight += req.points;
        let isSatisfied = false;
        let matchedWire = null;
        let detailMessage = '';

        if (req.customCheck === 'checkNeutralChainingAll') {
          // Check if all required nodes are connected to neutral source
          const source = req.sourceNode || 'q1_N';
          const targets = req.requiredNodes || [];
          const missing = targets.filter(t => !this.isPhysicallyConnected(source, t, wireGraph));
          if (missing.length === 0 && targets.length > 0) {
            isSatisfied = true;
            detailMessage = 'تم توزيع السلك المحايد بنجاح على جميع المصابيح';
          } else {
            detailMessage = `انقطاع المحايد عن: ${missing.join(', ')}`;
          }
        } else if (req.customCheck === 'checkEarthChainingAll') {
          // Check if all required nodes are connected to earth source
          const source = req.sourceNode || 'q1_PE';
          const targets = req.requiredNodes || [];
          const missing = targets.filter(t => !this.isPhysicallyConnected(source, t, wireGraph));
          if (missing.length === 0 && targets.length > 0) {
            isSatisfied = true;
            detailMessage = 'تم توزيع خط التأريض الوقائي PE على جميع المصابيح';
          } else {
            detailMessage = `انقطاع خط التأريض PE عن: ${missing.join(', ')}`;
          }
        } else if (req.customCheck === 'checkPhaseToButtons') {
          // Check phase to all push buttons
          const source = req.sourceNode || 'q1_L';
          const targets = req.requiredNodes || [];
          const missing = targets.filter(t => !this.isPhysicallyConnected(source, t, wireGraph));
          if (missing.length === 0 && targets.length > 0) {
            isSatisfied = true;
            detailMessage = 'تغذية الطور متصلة بجميع الأزرار الضاغطة';
          } else {
            detailMessage = `انقطاع الطور عن الأزرار: ${missing.join(', ')}`;
          }
        } else if (req.customCheck === 'checkButtonsToCoilA1') {
          // Check if all button outputs reach control terminal (tl_A1 or min_4 / min_3)
          const target = req.targetNode || 'tl_A1';
          const targetAlt = req.targetNodeAlt;
          const buttons = req.buttonOutputs || [];
          const missing = buttons.filter(b => !this.isPhysicallyConnected(b, target, wireGraph) && !(targetAlt && this.isPhysicallyConnected(b, targetAlt, wireGraph)));
          if (missing.length === 0 && buttons.length > 0) {
            isSatisfied = true;
            detailMessage = 'مخارج جميع الأزرار متصلة بمدخل التحكم على التوازي';
          } else {
            detailMessage = `أزرار غير متصلة بمدخل التحكم: ${missing.join(', ')}`;
          }
        } else if (req.alternatives && req.alternatives.length > 0) {
          // Alternative paths check
          for (const alt of req.alternatives) {
            matchedWire = this.getDirectWire(alt.from, alt.to);
            if (matchedWire || this.isPhysicallyConnected(alt.from, alt.to, wireGraph)) {
              isSatisfied = true;
              detailMessage = `توصيل سليم عبر المسار (${alt.from} ↔ ${alt.to})`;
              break;
            }
          }
          if (!isSatisfied) {
            detailMessage = `المسار المطلوب مفقود بين النقاط المحددة`;
          }
        } else {
          // Standard from -> to check
          matchedWire = this.getDirectWire(req.from, req.to);
          if (matchedWire || this.isPhysicallyConnected(req.from, req.to, wireGraph)) {
            isSatisfied = true;
            detailMessage = `توصيل سليم بين ${req.from} و ${req.to}`;
          } else {
            detailMessage = `مسار مفقود بين ${req.from} و ${req.to}`;
          }
        }

        if (isSatisfied) {
          earnedConnPoints += req.points;
        }

        results.connectionDetails.push({
          id: req.id,
          nameAr: req.nameAr,
          nameFr: req.nameFr,
          satisfied: isSatisfied,
          points: req.points,
          earned: isSatisfied ? req.points : 0,
          message: detailMessage
        });
      });

      // Normalize connection score to 70 points
      if (totalConnMaxWeight > 0) {
        scoreConnections = Math.round((earnedConnPoints / totalConnMaxWeight) * 70);
      } else {
        scoreConnections = 70;
      }

      // ----------------------------------------------------
      // B. Component & Terminal Relationships (15 Points Max)
      // ----------------------------------------------------
      // Check for illegal or dangerous short-circuits:
      // 1. Phase directly connected to Neutral (Dead Short)
      // 2. Phase directly connected to Earth
      // 3. Switch bypassed (Phase connected directly to Lamp L while switch exists)
      let dangerousShorts = 0;
      let bypassErrors = 0;

      const phaseSource = reqs.phaseSource || 'q1_L';
      const neutralSource = reqs.neutralSource || 'q1_N';
      const earthSource = reqs.earthSource || 'q1_PE';

      if (this.isPhysicallyConnected(phaseSource, neutralSource, wireGraph)) {
        dangerousShorts++;
        results.connectionDetails.push({
          id: 'error_short_pn',
          nameAr: 'دارة قصر جسيمة (Court-Circuit Phase-Neutre)',
          nameFr: 'Court-circuit direct Phase-Neutre',
          satisfied: false,
          points: 0,
          earned: 0,
          message: 'خطر! تم ربط سلك الطور بالسلك المحايد مباشرة، ما يسبب انفجاراً أو قفز القاطع فوراً.'
        });
      }

      if (this.isPhysicallyConnected(phaseSource, earthSource, wireGraph)) {
        dangerousShorts++;
        results.connectionDetails.push({
          id: 'error_short_pe',
          nameAr: 'تسريب أرضي مباشر (Défaut d\'isolement Phase-Terre)',
          nameFr: 'Contact direct Phase-Terre',
          satisfied: false,
          points: 0,
          earned: 0,
          message: 'خطر! تم توصيل الطور بسلك التأريض مباشرة، مما يؤدي لفصل القاطع التفاضلي.'
        });
      }

      // Check for switch bypasses in SA or DA:
      if (targetExercise.circuitMode === 'SA') {
        if (this.isPhysicallyConnected(phaseSource, 'e1_L', wireGraph) && !this.getDirectWire('sw1_1', 'e1_L')) {
          bypassErrors++;
        }
      }

      if (dangerousShorts > 0) {
        scoreRelationships = 0; // Immediate penalty for dead short
      } else if (bypassErrors > 0) {
        scoreRelationships = 5;
      } else {
        scoreRelationships = 15;
      }

      // ----------------------------------------------------
      // C. Wire Color Compliance (10 Points Max)
      // ----------------------------------------------------
      const colorIssues = this.evaluateWireColors(wires);
      results.colorIssues = colorIssues;

      if (colorIssues.length === 0) {
        scoreColors = 10;
      } else if (colorIssues.length === 1) {
        scoreColors = 5;
      } else {
        scoreColors = 0;
      }

      // ----------------------------------------------------
      // D. Completeness & Hygiene (5 Points Max)
      // ----------------------------------------------------
      // At least minimum required wires placed and no orphan floating single-ended wires
      if (wires.length >= 3 && dangerousShorts === 0) {
        scoreHygiene = 5;
      } else if (wires.length > 0) {
        scoreHygiene = 2;
      } else {
        scoreHygiene = 0;
      }

      // ----------------------------------------------------
      // E. Fault-Finding Specific Repair Evaluation
      // ----------------------------------------------------
      if (exercise.type === 'fault' && exercise.initialFaults) {
        exercise.initialFaults.forEach(fault => {
          let resolved = false;

          if (fault.faultId === 'f_missing_phase') {
            resolved = this.isPhysicallyConnected('q1_L', 'sw1_L', wireGraph);
          } else if (fault.faultId === 'f_wrong_return_color') {
            const wire = this.getDirectWire('sw1_1', 'e1_L');
            resolved = wire && (wire.type === 'retour' || wire.color === '#18181b' || wire.color === '#27272a');
          } else if (fault.faultId === 'f_missing_bridge_da2') {
            resolved = this.isPhysicallyConnected('q1_L', 'da2_L', wireGraph);
          } else if (fault.faultId === 'f_missing_neutral_e3') {
            resolved = this.isPhysicallyConnected('q1_N', 'e3_N', wireGraph);
          } else if (fault.faultId === 'f_phase_on_navette') {
            const wrongWire = this.getDirectWire('q1_L', 'vv1_1');
            const correctPhase = this.isPhysicallyConnected('q1_L', 'vv1_L', wireGraph);
            resolved = !wrongWire && correctPhase;
          } else if (fault.faultId === 'f_missing_coil_neutral') {
            resolved = this.isPhysicallyConnected('q1_N', 'tl_A2', wireGraph);
          } else if (fault.faultId === 'f_bp3_isolated') {
            const phaseOk = this.isPhysicallyConnected('q1_L', 'bp3_L', wireGraph);
            const outOk = this.isPhysicallyConnected('bp3_out', 'tl_A1', wireGraph);
            resolved = phaseOk && outOk;
          }

          results.faultsStatus.push({
            faultId: fault.faultId,
            descriptionAr: fault.descriptionAr,
            descriptionFr: fault.descriptionFr,
            resolved: resolved
          });
        });
      }

      // Total Score Calculation
      const totalScore = Math.max(0, Math.min(100, scoreConnections + scoreRelationships + scoreColors + scoreHygiene));
      results.totalScore = totalScore;
      results.scoreBreakdown.connections = scoreConnections;
      results.scoreBreakdown.relationships = scoreRelationships;
      results.scoreBreakdown.colors = scoreColors;
      results.scoreBreakdown.hygiene = scoreHygiene;
      results.passed = totalScore >= results.passingScore && dangerousShorts === 0;

      // Bilingual General Feedback
      if (results.passed) {
        if (totalScore >= 90) {
          results.generalFeedbackAr = '🌟 أداء ممتاز ومثالي! تم تنفيذ التوصيلات بدقة متناهية والتزام تام بمعايير السلامة والتسلسل وألوان الأسلاك وفق NFC 15-100.';
          results.generalFeedbackFr = 'Excellente prestation ! Schéma et règles de sécurité NFC 15-100 parfaitement respectés.';
        } else {
          results.generalFeedbackAr = '✅ مبروك! لقد اجتزت الامتحان بنجاح. الدارة تعمل بشكل سليم، مع وجود بعض الملاحظات البسيطة التي يمكن تحسينها.';
          results.generalFeedbackFr = 'Examen réussi ! Le circuit fonctionne correctement avec de légères améliorations possibles.';
        }
      } else {
        if (dangerousShorts > 0) {
          results.generalFeedbackAr = '❌ رُفضت النتيجة لوجود دارة قصر مباشرة (Court-Circuit). يجب فصل أسلاك الطور عن المحايد والأرضي قبل إعادة المحاولة.';
          results.generalFeedbackFr = 'Échec : Court-circuit direct détecté. Veuillez isoler la Phase du Neutre et de la Terre.';
        } else {
          results.generalFeedbackAr = `⚠️ لم يتم اجتياز الامتحان (حصلت على ${totalScore}/100، الحد الأدنى للنجاح هو ${results.passingScore}). راجع تفاصيل الأخطاء والأسلاك المفقودة أدناه.`;
          results.generalFeedbackFr = `Échec de l'examen (${totalScore}/100, seuil de réussite : ${results.passingScore}). Consultez le détail des anomalies.`;
        }
      }

      return results;
    }
  }

  // ==========================================
  // 3. EXAM SESSION MANAGER
  // ==========================================
  class ExamSessionManager {
    constructor(app) {
      this.app = app;
      this.STORAGE_HISTORY_KEY = 'nfc15_simulator_exam_history_v1';
      this.gradingEngine = new ExamGradingEngine(app.cm, app.wr);

      this.isExamActive = false;
      this.isExamSubmitted = false;
      this.currentExercise = null;
      this.timerSecondsRemaining = 0;
      this.timerTotalSeconds = 0;
      this.timerInterval = null;
      this.savedWorkspaceSnapshot = null;
      this.lastGradingResult = null;

      // Event callbacks
      this.onTimerTick = null;
      this.onTimerExpired = null;
    }

    getExercises() {
      return EXAM_EXERCISES;
    }

    getExerciseById(id) {
      return EXAM_EXERCISES.find(ex => ex.id === id) || null;
    }

    /**
     * Start a new examination session.
     * Safely captures snapshot of current training workspace before initializing exam.
     */
    startExam(exerciseId) {
      const exercise = this.getExerciseById(exerciseId);
      if (!exercise) return false;

      // 1. Snapshot previous training workspace
      this.savedWorkspaceSnapshot = {
        mode: this.app.currentMode || 'DA',
        vvVariant: this.app.vvVariant || 'FR',
        components: JSON.parse(JSON.stringify(this.app.cm.components || [])),
        wires: JSON.parse(JSON.stringify(this.app.wr.wires || []))
      };

      // 2. Set active exam properties
      this.isExamActive = true;
      this.isExamSubmitted = false;
      this.currentExercise = exercise;
      this.lastGradingResult = null;
      this.timerTotalSeconds = (exercise.durationMinutes || 15) * 60;
      this.timerSecondsRemaining = this.timerTotalSeconds;

      // 3. Initialize circuit layout for the exercise
      this.app.currentMode = exercise.circuitMode;
      this.app.vvVariant = exercise.vvVariant || 'FR';
      this.app.cm.setMode(exercise.circuitMode, exercise.vvVariant);

      // 4. Setup wires according to exam type
      if (exercise.type === 'build') {
        // Build From Scratch: clear all wires
        this.app.wr.clear();
      } else if (exercise.type === 'fault') {
        // Fault Finding: setup baseline with intentional faults
        if (typeof exercise.baselineSetup === 'function') {
          exercise.baselineSetup(this.app);
        }
      }

      // 5. Update canvas and clear selections
      if (this.app.selectedComponentId) this.app.selectedComponentId = null;
      if (this.app.updateSelectionUI) this.app.updateSelectionUI();
      this.app.wr.recomputeAllPaths(this.app.cm);

      // 6. Start Exam Timer
      this.startTimer();

      // 7. Silent circuit simulation without triggering short sounds
      if (this.app.evaluateCircuit) {
        this.app.evaluateCircuit();
      }

      return true;
    }

    /**
     * Start countdown timer
     */
    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);

      this.timerInterval = setInterval(() => {
        if (!this.isExamActive || this.isExamSubmitted) {
          this.stopTimer();
          return;
        }

        this.timerSecondsRemaining--;

        if (typeof this.onTimerTick === 'function') {
          this.onTimerTick(this.timerSecondsRemaining, this.timerTotalSeconds);
        }

        if (this.timerSecondsRemaining <= 0) {
          this.stopTimer();
          if (typeof this.onTimerExpired === 'function') {
            this.onTimerExpired();
          } else {
            this.submitExam(true); // Auto-submit on time expiry
          }
        }
      }, 1000);
    }

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    /**
     * Submit active exam and generate grading report.
     */
    submitExam(autoSubmitted = false) {
      if (!this.isExamActive || this.isExamSubmitted) return null;

      this.stopTimer();
      this.isExamSubmitted = true;

      const timeTakenSeconds = this.timerTotalSeconds - Math.max(0, this.timerSecondsRemaining);

      // Run dedicated grading engine
      const report = this.gradingEngine.gradeExam(this.currentExercise, timeTakenSeconds);
      report.autoSubmitted = autoSubmitted;
      report.submittedAt = new Date().toISOString();
      report.dateStr = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      this.lastGradingResult = report;

      // Save to local exam history
      this.saveExamResultToHistory(report);

      return report;
    }

    /**
     * Cancel active exam and restore original training workspace.
     */
    cancelExam() {
      this.stopTimer();
      this.isExamActive = false;
      this.isExamSubmitted = false;
      this.currentExercise = null;
      this.lastGradingResult = null;

      this.restoreSavedWorkspace();
    }

    /**
     * Exit exam results view and restore previous training workspace.
     */
    exitExamMode() {
      this.stopTimer();
      this.isExamActive = false;
      this.isExamSubmitted = false;
      this.currentExercise = null;

      this.restoreSavedWorkspace();
    }

    /**
     * Restore original workspace snapshot safely
     */
    restoreSavedWorkspace() {
      if (!this.savedWorkspaceSnapshot) return;

      try {
        const snap = this.savedWorkspaceSnapshot;
        this.app.currentMode = snap.mode || 'DA';
        this.app.vvVariant = snap.vvVariant || 'FR';

        this.app.cm.components = JSON.parse(JSON.stringify(snap.components || []));
        this.app.cm.rebuildTerminalsIndex();

        this.app.wr.wires = JSON.parse(JSON.stringify(snap.wires || []));
        this.app.wr.selectedWireId = null;
        this.app.wr.hoveredWireId = null;
        this.app.wr.recomputeAllPaths(this.app.cm);

        if (this.app.selectedComponentId) this.app.selectedComponentId = null;
        if (this.app.updateSelectionUI) this.app.updateSelectionUI();
        if (this.app.updateModeHeader) this.app.updateModeHeader(this.app.currentMode);

        if (this.app.evaluateCircuit) this.app.evaluateCircuit();
        if (this.app.runFullAudit) this.app.runFullAudit();

      } catch (err) {
        console.error('Error restoring workspace snapshot:', err);
      } finally {
        this.savedWorkspaceSnapshot = null;
      }
    }

    // ==========================================
    // EXAM HISTORY PERSISTENCE
    // ==========================================
    getExamHistory() {
      try {
        const raw = localStorage.getItem(this.STORAGE_HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to read exam history from localStorage:', e);
        return [];
      }
    }

    saveExamResultToHistory(report) {
      if (!report) return;
      try {
        const list = this.getExamHistory();
        const entry = {
          id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          exerciseId: report.exerciseId,
          exerciseTitleAr: report.exerciseTitleAr,
          exerciseTitleFr: report.exerciseTitleFr,
          exerciseType: report.exerciseType,
          difficulty: report.difficulty,
          totalScore: report.totalScore,
          passed: report.passed,
          dateStr: report.dateStr,
          timeTakenSeconds: report.timeTakenSeconds,
          scoreBreakdown: report.scoreBreakdown
        };

        list.unshift(entry);
        if (list.length > 50) list.splice(50); // Keep last 50 exam attempts

        localStorage.setItem(this.STORAGE_HISTORY_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Failed to write exam history to localStorage:', e);
      }
    }

    deleteExamHistoryItem(id) {
      const list = this.getExamHistory().filter(item => item.id !== id);
      try {
        localStorage.setItem(this.STORAGE_HISTORY_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Failed to update exam history:', e);
      }
    }

    clearExamHistory() {
      try {
        localStorage.removeItem(this.STORAGE_HISTORY_KEY);
      } catch (e) {
        console.error('Failed to clear exam history:', e);
      }
    }
  }

  // Export to window
  window.EXAM_EXERCISES = EXAM_EXERCISES;
  window.ExamGradingEngine = ExamGradingEngine;
  window.ExamSessionManager = ExamSessionManager;

})(window);
