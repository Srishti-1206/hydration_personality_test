/**
 * Droplet Mascot SVG Generator & Animator
 * Soft, cute, translucent water-blob character with blushing cheeks,
 * glossy highlights, and custom personality costumes/expressions.
 */

const MascotSVGs = {
  // Default cute smiling droplet (Original soft, borderless, super cute version)
  default: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-default" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dropGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E0FBFC"/>
          <stop offset="45%" stop-color="#48CAE4"/>
          <stop offset="85%" stop-color="#028090"/>
          <stop offset="100%" stop-color="#006A78"/>
        </radialGradient>
        <linearGradient id="shineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#028090" flood-opacity="0.25"/>
        </filter>
      </defs>
      <!-- Shadow -->
      <ellipse cx="80" cy="148" rx="42" ry="7" fill="#000000" opacity="0.12"/>
      <!-- Soft cute water droplet body -->
      <path filter="url(#softGlow)" d="M80 18 C78 20, 36 68, 36 104 C36 128, 55 144, 80 144 C105 144, 124 128, 124 104 C124 68, 82 20, 80 18 Z" fill="url(#dropGrad)"/>
      <!-- Glossy highlight bubble -->
      <ellipse cx="62" cy="74" rx="14" ry="24" transform="rotate(-25 62 74)" fill="url(#shineGrad)"/>
      <circle cx="54" cy="106" r="5" fill="#ffffff" opacity="0.6"/>
      <!-- Soft Rosy Blushing Cheeks -->
      <ellipse cx="55" cy="108" rx="8" ry="5" fill="#FF8787" opacity="0.65"/>
      <ellipse cx="105" cy="108" rx="8" ry="5" fill="#FF8787" opacity="0.65"/>
      <!-- Big Sparkly Eyes -->
      <g class="mascot-eyes">
        <ellipse cx="66" cy="98" rx="5.5" ry="7.5" fill="#0F172A"/>
        <circle cx="64" cy="95" r="2.5" fill="#ffffff"/>
        <circle cx="68" cy="101" r="1.2" fill="#ffffff"/>
        
        <ellipse cx="94" cy="98" rx="5.5" ry="7.5" fill="#0F172A"/>
        <circle cx="92" cy="95" r="2.5" fill="#ffffff"/>
        <circle cx="96" cy="101" r="1.2" fill="#ffffff"/>
      </g>
      <!-- Happy Smile -->
      <path d="M73 108 Q80 115 87 108" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Tiny Waving Little Arm -->
      <path d="M120 102 Q134 94 135 84 Q128 85 118 94" fill="#38BDF8" opacity="0.9"/>
    </svg>
  `,

  // Loading: Super cute thinking droplet with baby bubbles & sparkles (NOT a ghost!)
  loading: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-loading" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="loadingGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E0FBFC"/>
          <stop offset="45%" stop-color="#38BDF8"/>
          <stop offset="85%" stop-color="#028090"/>
          <stop offset="100%" stop-color="#00606D"/>
        </radialGradient>
        <linearGradient id="loadingShine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <!-- Shadow -->
      <ellipse cx="80" cy="148" rx="42" ry="7" fill="#000000" opacity="0.12"/>
      <!-- Main Cute Droplet Body -->
      <path d="M80 18 C78 20, 36 68, 36 104 C36 128, 55 144, 80 144 C105 144, 124 128, 124 104 C124 68, 82 20, 80 18 Z" fill="url(#loadingGrad)"/>
      <!-- Glossy highlight -->
      <ellipse cx="62" cy="74" rx="14" ry="24" transform="rotate(-25 62 74)" fill="url(#loadingShine)"/>
      <circle cx="54" cy="106" r="5" fill="#ffffff" opacity="0.6"/>
      <!-- Cute Blushing Cheeks -->
      <ellipse cx="55" cy="108" rx="8" ry="5" fill="#FF8787" opacity="0.75"/>
      <ellipse cx="105" cy="108" rx="8" ry="5" fill="#FF8787" opacity="0.75"/>
      <!-- Curious Sparkly Anime Eyes Looking Up -->
      <g class="mascot-eyes">
        <ellipse cx="66" cy="96" rx="5.5" ry="7.5" fill="#0F172A"/>
        <circle cx="68" cy="93" r="2.6" fill="#ffffff"/>
        <circle cx="63" cy="98" r="1.3" fill="#ffffff"/>
        
        <ellipse cx="94" cy="96" rx="5.5" ry="7.5" fill="#0F172A"/>
        <circle cx="96" cy="93" r="2.6" fill="#ffffff"/>
        <circle cx="91" cy="98" r="1.3" fill="#ffffff"/>
      </g>
      <!-- Sweet Happy Open Mouth with tiny pink tongue -->
      <path d="M74 108 Q80 118 86 108 Z" fill="#F43F5E"/>
      <path d="M72 108 Q80 112 88 108" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Floating Cute Baby Bubbles -->
      <circle cx="28" cy="62" r="6" fill="#7DD3FC" opacity="0.75"/>
      <circle cx="26" cy="60" r="2" fill="#ffffff"/>
      <circle cx="132" cy="56" r="7" fill="#7DD3FC" opacity="0.75"/>
      <circle cx="130" cy="54" r="2.5" fill="#ffffff"/>
      <circle cx="126" cy="38" r="4" fill="#BAE6FD" opacity="0.65"/>
      <!-- Little Golden Sparkles -->
      <path d="M38 36 L40 40 L44 42 L40 44 L38 48 L36 44 L32 42 L36 40 Z" fill="#FDE047"/>
      <path d="M120 78 L121 81 L124 82 L121 83 L120 86 L119 83 L116 82 L119 81 Z" fill="#FDE047"/>
    </svg>
  `,

  // Cactus: Super cute desert succulent droplet sitting cozy in a terracotta pot with blossom & warm chai
  cactus: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-cactus" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cactusGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ECFDF5"/>
          <stop offset="35%" stop-color="#6EE7B7"/>
          <stop offset="75%" stop-color="#10B981"/>
          <stop offset="100%" stop-color="#047857"/>
        </radialGradient>
        <linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FB923C"/>
          <stop offset="50%" stop-color="#EA580C"/>
          <stop offset="100%" stop-color="#9A3412"/>
        </linearGradient>
        <filter id="cactusGlow">
          <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#10B981" flood-opacity="0.28"/>
        </filter>
      </defs>

      <!-- Shadow -->
      <ellipse cx="80" cy="150" rx="46" ry="7" fill="#000000" opacity="0.14"/>

      <!-- Terracotta Pot Base (droplet sits snugly inside) -->
      <polygon points="46,120 114,120 106,146 54,146" fill="url(#potGrad)"/>
      <rect x="42" y="114" width="76" height="8" rx="3" fill="#F97316" stroke="#C2410C" stroke-width="1.5"/>
      <ellipse cx="80" cy="120" rx="34" ry="4" fill="#78350F" opacity="0.45"/>

      <!-- Left Cactus Arm -->
      <path d="M42 92 C30 92, 26 80, 34 74 C42 68, 48 82, 46 96" fill="#10B981" stroke="#047857" stroke-width="2.2"/>
      <!-- Right Cactus Arm (holding chai) -->
      <path d="M118 92 C130 92, 134 82, 126 76 C118 70, 112 84, 114 98" fill="#10B981" stroke="#047857" stroke-width="2.2"/>

      <!-- Main Succulent Droplet Body -->
      <path filter="url(#cactusGlow)" d="M80 20 C76 24, 38 68, 38 104 C38 124, 52 136, 80 136 C108 136, 122 124, 122 104 C122 68, 84 24, 80 20 Z" fill="url(#cactusGrad)" stroke="#A7F3D0" stroke-width="2"/>

      <!-- Glossy highlight bubble -->
      <ellipse cx="62" cy="72" rx="12" ry="22" transform="rotate(-22 62 72)" fill="#ffffff" opacity="0.45"/>
      <circle cx="56" cy="100" r="4" fill="#ffffff" opacity="0.6"/>

      <!-- Little Desert Blossom on Head -->
      <g transform="translate(0, -2)">
        <circle cx="80" cy="20" r="8" fill="#F43F5E"/>
        <circle cx="73" cy="16" r="6" fill="#FB7185"/>
        <circle cx="87" cy="16" r="6" fill="#FB7185"/>
        <circle cx="80" cy="12" r="6" fill="#FDA4AF"/>
        <circle cx="80" cy="18" r="4" fill="#FDE047"/>
      </g>

      <!-- Cute Soft Cactus Prickle Tufts (little golden stars/tufts) -->
      <g stroke="#FDE047" stroke-width="2" stroke-linecap="round">
        <path d="M50 78 L54 78 M52 76 L52 80"/>
        <path d="M44 102 L48 102 M46 100 L46 104"/>
        <path d="M110 78 L114 78 M112 76 L112 80"/>
        <path d="M114 104 L118 104 M116 102 L116 106"/>
        <path d="M80 50 L84 50 M82 48 L82 52"/>
      </g>

      <!-- Cute Rosy Cheeks -->
      <ellipse cx="58" cy="104" rx="8" ry="5" fill="#FB7185" opacity="0.75"/>
      <ellipse cx="102" cy="104" rx="8" ry="5" fill="#FB7185" opacity="0.75"/>

      <!-- Big Sparkly Eyes (like turtle & default droplet) -->
      <g class="mascot-eyes">
        <ellipse cx="66" cy="94" rx="5.2" ry="7.2" fill="#064E3B"/>
        <circle cx="64" cy="91" r="2.2" fill="#ffffff"/>
        <circle cx="68" cy="96" r="1.1" fill="#ffffff"/>
        
        <ellipse cx="94" cy="94" rx="5.2" ry="7.2" fill="#064E3B"/>
        <circle cx="92" cy="91" r="2.2" fill="#ffffff"/>
        <circle cx="96" cy="96" r="1.1" fill="#ffffff"/>
      </g>

      <!-- Sweet Happy Smile -->
      <path d="M74 103 Q80 110 86 103" fill="none" stroke="#064E3B" stroke-width="2.8" stroke-linecap="round"/>

      <!-- Steaming Chai Cup in hand -->
      <rect x="122" y="90" width="16" height="18" rx="3" fill="#FFFBEB" stroke="#D97706" stroke-width="1.8"/>
      <path d="M138 94 C143 94, 143 102, 138 102" fill="none" stroke="#D97706" stroke-width="1.8"/>
      <path d="M126 86 Q127 82 129 80 M131 86 Q132 81 134 79" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,

  // Casual Sipper: Cozy cat-eared puddle blob with half-lidded relaxed eyes
  casual_sipper: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-sipper" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sipperGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E0F2FE"/>
          <stop offset="45%" stop-color="#38BDF8"/>
          <stop offset="90%" stop-color="#0284C7"/>
        </radialGradient>
        <filter id="sipperGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0284C7" flood-opacity="0.25"/>
        </filter>
      </defs>
      <ellipse cx="80" cy="148" rx="48" ry="8" fill="#000000" opacity="0.12"/>
      <!-- Cat ears on top of droplet -->
      <polygon points="56,50 48,26 70,38" fill="#38BDF8"/>
      <polygon points="56,48 51,32 66,40" fill="#F472B6"/>
      <polygon points="104,50 112,26 90,38" fill="#38BDF8"/>
      <polygon points="104,48 109,32 94,40" fill="#F472B6"/>
      <!-- Body Droplet -->
      <path filter="url(#sipperGlow)" d="M80 32 C65 42, 34 78, 34 110 C34 134, 54 144, 80 144 C106 144, 126 134, 126 110 C126 78, 95 42, 80 32 Z" fill="url(#sipperGrad)"/>
      <!-- Cute cheeks & whiskers -->
      <ellipse cx="54" cy="112" rx="7" ry="5" fill="#F472B6" opacity="0.6"/>
      <ellipse cx="106" cy="112" rx="7" ry="5" fill="#F472B6" opacity="0.6"/>
      <path d="M42 110 L28 108 M42 114 L29 116 M118 110 L132 108 M118 114 L131 116" stroke="#0369A1" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Happy cozy half-moon eyes -->
      <path d="M62 100 Q68 94 74 100" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M86 100 Q92 94 98 100" fill="none" stroke="#0F172A" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Cat :3 mouth with straw -->
      <path d="M75 110 Q78 114 80 111 Q82 114 85 110" fill="none" stroke="#0F172A" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Sippy tumbler cup -->
      <polygon points="112,110 126,110 122,136 114,136" fill="#FDE047" stroke="#CA8A04" stroke-width="1.8"/>
      <line x1="120" y1="110" x2="124" y2="96" stroke="#EC4899" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Steady Turtle: Calm droplet with shell backpack and wise smiling eyes
  steady_turtle: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-turtle" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="turtleGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#CCFBF1"/>
          <stop offset="45%" stop-color="#2DD4BF"/>
          <stop offset="90%" stop-color="#0D9488"/>
        </radialGradient>
        <filter id="turtleGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0D9488" flood-opacity="0.25"/>
        </filter>
      </defs>
      <ellipse cx="80" cy="148" rx="44" ry="7" fill="#000000" opacity="0.12"/>
      <!-- Turtle Shell Backpack behind body -->
      <ellipse cx="44" cy="98" rx="22" ry="30" fill="#15803D" stroke="#166534" stroke-width="3"/>
      <path d="M36 82 L52 82 M32 98 L56 98 M36 114 L52 114 M44 70 L44 126" stroke="#86EFAC" stroke-width="2" stroke-linecap="round"/>
      <!-- Body Droplet -->
      <path filter="url(#turtleGlow)" d="M86 26 C82 30, 48 72, 48 106 C48 130, 66 144, 90 144 C114 144, 132 130, 132 106 C132 72, 90 30, 86 26 Z" fill="url(#turtleGrad)"/>
      <!-- Backpack strap -->
      <path d="M68 84 Q80 102 78 126" fill="none" stroke="#CA8A04" stroke-width="4" stroke-linecap="round"/>
      <!-- Soft blushing cheeks -->
      <ellipse cx="78" cy="108" rx="7" ry="5" fill="#F87171" opacity="0.6"/>
      <ellipse cx="118" cy="108" rx="7" ry="5" fill="#F87171" opacity="0.6"/>
      <!-- Zen calm eyes -->
      <path d="M78 98 Q85 92 92 98" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
      <path d="M106 98 Q113 92 120 98" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
      <!-- Content peaceful smile -->
      <path d="M92 110 Q98 117 105 110" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `,

  // Happy Dolphin: Dynamic energetic droplet with playful splashing bubbles
  happy_dolphin: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-dolphin" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="dolphinGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E0F2FE"/>
          <stop offset="45%" stop-color="#06B6D4"/>
          <stop offset="90%" stop-color="#0891B2"/>
        </radialGradient>
        <filter id="dolphinGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0891B2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <ellipse cx="80" cy="148" rx="46" ry="7" fill="#000000" opacity="0.12"/>
      <!-- Leaping tail fins on top -->
      <path d="M78 28 C74 12, 60 8, 52 14 C62 22, 70 26, 78 28 Z" fill="#06B6D4"/>
      <path d="M82 28 C86 12, 100 8, 108 14 C98 22, 90 26, 82 28 Z" fill="#06B6D4"/>
      <!-- Leaping Body Droplet -->
      <path filter="url(#dolphinGlow)" d="M80 24 C72 34, 34 70, 34 104 C34 128, 54 144, 80 144 C106 144, 126 128, 126 104 C126 70, 88 34, 80 24 Z" fill="url(#dolphinGrad)"/>
      <!-- Dolphin pectoral flippers -->
      <path d="M34 98 C20 102, 16 112, 22 118 C28 116, 32 108, 34 98 Z" fill="#0891B2"/>
      <path d="M126 98 C140 102, 144 112, 138 118 C132 116, 128 108, 126 98 Z" fill="#0891B2"/>
      <!-- Rosy cheeks -->
      <ellipse cx="56" cy="105" rx="8" ry="5" fill="#FB7185" opacity="0.65"/>
      <ellipse cx="104" cy="105" rx="8" ry="5" fill="#FB7185" opacity="0.65"/>
      <!-- Joyful winking or starry eyes -->
      <circle cx="66" cy="94" r="5" fill="#0F172A"/>
      <circle cx="64" cy="92" r="2" fill="#ffffff"/>
      <!-- Sparkle eye on right -->
      <path d="M96 90 L98 95 L103 97 L98 99 L96 104 L94 99 L89 97 L94 95 Z" fill="#0F172A"/>
      <!-- Big open laughing smile -->
      <path d="M72 106 Q80 120 88 106 Z" fill="#F43F5E"/>
      <!-- Floating water splashes -->
      <circle cx="24" cy="68" r="4" fill="#38BDF8" opacity="0.8"/>
      <circle cx="134" cy="64" r="5" fill="#38BDF8" opacity="0.8"/>
      <circle cx="140" cy="80" r="3" fill="#38BDF8" opacity="0.6"/>
    </svg>
  `,

  // Water Whale: Chonky magnificent aquatic legend with a mini blowhole water spout
  water_whale: `
    <svg viewBox="0 0 160 160" class="mascot-svg droplet-whale" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="whaleGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#DBEAFE"/>
          <stop offset="45%" stop-color="#3B82F6"/>
          <stop offset="90%" stop-color="#1D4ED8"/>
        </radialGradient>
        <filter id="whaleGlow">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1D4ED8" flood-opacity="0.3"/>
        </filter>
      </defs>
      <ellipse cx="80" cy="150" rx="52" ry="7" fill="#000000" opacity="0.14"/>
      <!-- Water Spout on head -->
      <path d="M80 32 C78 20, 68 12, 58 14 C70 18, 76 26, 78 32 Z" fill="#60A5FA"/>
      <path d="M80 32 C82 20, 92 12, 102 14 C90 18, 84 26, 82 32 Z" fill="#60A5FA"/>
      <circle cx="80" cy="10" r="3.5" fill="#93C5FD"/>
      <!-- Giant chonky whale body -->
      <path filter="url(#whaleGlow)" d="M80 30 C58 36, 24 68, 24 108 C24 136, 48 146, 80 146 C112 146, 136 136, 136 108 C136 68, 102 36, 80 30 Z" fill="url(#whaleGrad)"/>
      <!-- Whale belly grooves -->
      <path d="M48 124 Q80 140 112 124 M54 132 Q80 144 106 132" fill="none" stroke="#BFDBFE" stroke-width="2.5" opacity="0.6"/>
      <!-- Rosy blushing cheeks -->
      <ellipse cx="48" cy="106" rx="8" ry="6" fill="#F472B6" opacity="0.7"/>
      <ellipse cx="112" cy="106" rx="8" ry="6" fill="#F472B6" opacity="0.7"/>
      <!-- Cheerful squinty happy eyes -->
      <path d="M54 96 Q62 90 70 96" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M90 96 Q98 90 106 96" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Content wide smile -->
      <path d="M72 108 Q80 118 88 108" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      <!-- Tiny water jug held in fin -->
      <rect x="122" y="102" width="16" height="24" rx="4" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2"/>
      <path d="M126 102 L126 97 Q130 95 134 97 L134 102" stroke="#38BDF8" stroke-width="2" fill="none"/>
    </svg>
  `
};

window.MascotSVGs = MascotSVGs;
