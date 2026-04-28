/* global React */
// Original 8-bit fantasy boss sprites - drawn as inline SVG with pixel rects
// Each sprite is built from a small pixel grid. Color codes:
// .=transparent, others map via palette prop

const Pixel = ({ x, y, c, s = 4 }) => (
  <rect x={x * s} y={y * s} width={s} height={s} fill={c} shapeRendering="crispEdges" />
);

function gridSprite(rows, palette, size = 4) {
  const cells = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.' && palette[ch]) {
        cells.push(<Pixel key={`${x}-${y}`} x={x} y={y} c={palette[ch]} s={size} />);
      }
    });
  });
  return cells;
}

// === BAPHOMET-STYLE DEMON LORD (CEO) ===
// Original design: massive horns, bearded demon head, torso, weapon
const DEMON_LORD = [
  '..............HH....HH..............',
  '.............HHH....HHH.............',
  '............HHHH....HHHH............',
  '...........HHHHK....KHHHH...........',
  '..........HHHHKK....KKHHHH..........',
  '.........HHHHKKKKKKKKKKHHHH.........',
  '........HHHHKKKKKKKKKKKKHHHH........',
  '........HHKKKKDDDDDDDDKKKKHH........',
  '.........KKKDDDDDDDDDDDDKKK.........',
  '.........KKDDDDRRDDDDRRDDKK.........',
  '..........KDDDRRWWDDRRWWDK..........',
  '..........KDDDRRWWDDRRWWDK..........',
  '..........KDDDDDDFFDDDDDDK..........',
  '...........KDDDFFFFFFDDDK...........',
  '............KDDFWWWWFDDK............',
  '.............KDFWWWWFDK.............',
  '............KKDDFFFFDDKK............',
  '...........KKKBBBBBBBBKKK...........',
  '..........KKBBBBBBBBBBBBKK..........',
  '.........KBBBYYYBBBBYYYBBBK.........',
  '........KBBBYGGGYBYGGGYBBBBK........',
  '........BBBYGGGGGGGGGGGYBBBB........',
  '........BBBYGGGGGGGGGGGYBBBB........',
  '........BBBYGGGGGGGGGGGYBBBB........',
  '........BBBBYYYYYYYYYYYBBBB........',
  '.........BBBBBBBBBBBBBBBBB..........',
  '.........BBBB.BBBB..BBBB............',
  '..........BB...BB....BB.............',
  '.........KKB...KK....BKK............',
  '.........KKK...KK....KKK............',
];

const PAL_DEMON = {
  H: '#1a0612', // dark horn outline
  K: '#0a0309', // black outline
  D: '#a8324a', // demon red skin
  R: '#e84561', // bright red highlight
  W: '#fff5d8', // eye white / glow
  F: '#5b1830', // dark red mouth/fur
  B: '#3a1248', // dark purple cloak
  Y: '#d4a548', // gold trim
  G: '#7a1a2c', // crimson chest gem
};

// === DARK LORD KNIGHT (Chief of Staff #1) ===
const DARK_LORD = [
  '............KKKKKKKK............',
  '...........KSSSSSSSSK...........',
  '..........KSSPPPSSPPK...........',
  '..........KSSPPPSSPPSK..........',
  '.........KSSSPPPPPPPSSK.........',
  '.........KSSPPRRRRPPSSK.........',
  '.........KSPRRWWWWRRPSK.........',
  '.........KSPRRWWWWRRPSK.........',
  '.........KSSPPRRRRPPSSK.........',
  '..........KSSPPPPPPSSK..........',
  '...........KKSSSSSKK............',
  '............KSSSSSK.............',
  '...........KKSSSSSKK............',
  '..........KKSSSSSSSKK...........',
  '.........KKMMMMMMMMMKK..........',
  '........KKMMMRRRRRMMKK..........',
  '.......KKMMMMMRRMMMMKK..........',
  '......KKMMMRRMMMMMRRMKK.........',
  '.....KKMMRRRMMMMMMRRMMKK........',
  '....KKMMRRRMMMMMMMMRRMMKK.......',
  '...KKMMMMMMMMMMMMMMMMMMKK.......',
  '..KKMMMMMMMSSSSSSSMMMMMMKK......',
  '.KKMMMMMMSSSYYYYYYSSMMMMMKK.....',
  'KKMMMMMSSSSYYYYYYSSSSMMMMMKK....',
  '.KKMMMMSSSSSSSSSSSSSSMMMMKK.....',
  '..KKMMMMSSSSSSSSSSSMMMMKK.......',
  '...KKMMMMMSSSSSSSMMMMKK.........',
  '.....KKMMMMMMMMMMMMKK...........',
  '......KKMMMMMMMMMMKK............',
  '........KKKK..KKKK..............',
];

const PAL_DARK_LORD = {
  K: '#0a0309',
  S: '#3a3548', // grey steel armor
  P: '#1a0612', // dark visor opening
  R: '#a8324a', // red glow inside helm
  W: '#fff5d8', // eye glow
  M: '#1a1024', // black cloak
  Y: '#d4a548', // gold trim
};

// === AMON RA - SUN GOD (Chief of Staff #2) ===
const AMON_RA = [
  '............YYYYYYYY............',
  '...........YYYYYYYYYY...........',
  '..........YYYRRRRRRYYY..........',
  '.........YYYRRRRRRRRRYY.........',
  '........YYYRRRRRRRRRRYYY........',
  '........YYRRGGGGGGGGRRYY........',
  '........YRRGGGGGGGGGGRRY........',
  '.......YYRGGAAAAAAAAGGRYY.......',
  '.......YRRGAACCCCCCAAGRRYY......',
  '.......YRGGACCWWWWCCAAGRRY......',
  '.......YRGAACCWWKKWWCCAGRY......',
  '.......YRGAACCWWKKWWCCAGRY......',
  '.......YRGGACCCCCCCCCAGRRY......',
  '........YRGAAACCKKCCAAGRY.......',
  '........YRGGAAAACCAAAGGRY.......',
  '.........YRRGGAAAAAAGGRRY.......',
  '..........YYRGGAAAAGGRY.........',
  '...........YYYRGGGGRYY..........',
  '............YBBBBBBYY...........',
  '...........YBBBYYYBBBY..........',
  '..........YBBYYAAAYYBBY.........',
  '.........YBBYYAAAAAAYBBY........',
  '........YBBYYAAAAAAAAYYBBY......',
  '.......YBBYYAAAAAAAAAAYYBBY.....',
  '.......YBBYAAAAYYAAAAAYBBY......',
  '........BBYYYYYYYYYYYYYBB.......',
  '.........BBBBBBBBBBBBBBB........',
  '..........BBB......BBBB.........',
  '.........KKBB......BBKKK........',
  '.........KKK........KKKK........',
];

const PAL_AMON_RA = {
  Y: '#f5c563', // bright gold
  R: '#d4a548', // gold mid
  G: '#8a6a26', // gold dark / outline
  A: '#a8503a', // copper bronze skin
  C: '#5b1830', // dark inside head
  W: '#fff5d8', // eye glow
  K: '#0a0309',
  B: '#3a1248', // robe purple
};

// === EVIL SNAKE LORD (Chief of Staff #3) ===
const SNAKE_LORD = [
  '..............KKKKKK............',
  '............KKGGGGGGKK..........',
  '...........KGGGGGGGGGGK.........',
  '..........KGGGGNNNNNGGGK........',
  '..........KGGNNNNNNNNGGK........',
  '..........KGNNRRRRNNNNGK........',
  '.........KGNNRRWWRRNNNGK........',
  '.........KGNRRWKKWRRNGGK........',
  '.........KGNRRWKKWRRNGGK........',
  '.........KGNNRRWWRRNNGGK........',
  '..........KGNNNFFNNNGGK.........',
  '..........KGGNNFFNNGGK..........',
  '..........KGGGNNNNGGGK..........',
  '..........KGGGGGGGGGK...........',
  '..........KGGGGGGGGGK...........',
  '..........KGGYYYYYGGK...........',
  '..........KGGYAAAYGGK...........',
  '.........KGGGYAAAYGGGK..........',
  '.........KGGNNNNNNNGGK..........',
  '........KGGNNGGGGGNNGGK.........',
  '.......KGGNGGGGGGGGGNGGK........',
  '......KGGNGGGGGGGGGGGNGGK.......',
  '.....KGGNGGGGGNNNNGGGGNGGK......',
  '....KGGNGGGGNNGGGGNNGGGNGGK.....',
  '....KGNGGGGNNGGGGGGNNGGGNGK.....',
  '....KGNGGGGNGGGGGGGGNGGGNGK.....',
  '....KGNGGGGNGGGGGGGGNGGGNGK.....',
  '.....KGGNNGGGGGGGGGGGGNNGK......',
  '......KGGGNNNNNGGNNNNNGGK.......',
  '.......KKGGGGGGGGGGGGGKK........',
];

const PAL_SNAKE = {
  K: '#0a0309',
  G: '#2d6b3a', // mid green scales
  N: '#5fa84a', // bright green highlight
  R: '#a8324a', // red eye area
  W: '#f5c563', // yellow eye
  F: '#5b1830', // mouth fangs area
  Y: '#d4a548', // gold collar
  A: '#3a1248', // gem
};

// === THANATOS - DEATH REAPER (Chief of Staff #4) ===
const THANATOS = [
  '..........MMMMMMMMMMMM..........',
  '........MMMMMMMMMMMMMMMM........',
  '......MMMMMMMMMMMMMMMMMMMM......',
  '.....MMMMMMSSSSSSSSSMMMMMM......',
  '....MMMMMSSSSSSSSSSSSMMMMMM.....',
  '....MMMSSSSKKKKKKKKKSSSSMMM.....',
  '....MMMSSKKWWWWWWWWWKKSSMMM.....',
  '....MMSSKWWWWWWWWWWWWWKSSMM.....',
  '....MSSKWWWKKKWWWKKKWWWKSSM.....',
  '....MSKWWKKCCKWWKCCKKWWKSM......',
  '....MSKWWKCCCKWWKCCCKWWKSM......',
  '....MSKWWWKKKWWWKKKWWWWKSM......',
  '....MSSKWWWWWKKWWWWWWWKSSM......',
  '....MMSKWWWKKKKKKWWWWKSMM.......',
  '....MMSSKWWWKKKKWWWWKSSMM.......',
  '.....MMSSKWWWWWWWWWKSSMM........',
  '......MMSSKKWWWWWKKSSMM.........',
  '.......MMSSKKKKKKSSSMM..........',
  '........MMMMMMMMMMMMM...........',
  '.......MMMMMMMMMMMMMMM..........',
  '......MMMMMSSSSSSSMMMMM.........',
  '.....MMMMSSSSCCSSSSMMMMM........',
  '....MMMSSSSSCCCCSSSSSMMM........',
  '...MMMSSSSSSCCCCSSSSSSMMM.......',
  '..MMMMSSSSSSCCCCSSSSSSMMM.......',
  '..MMMMSSSSSSSSSSSSSSSSMMM.......',
  '..MMMMMSSSSSSSSSSSSSSMMMM.......',
  '...MMMMMSSSSSSSSSSSMMMMM........',
  '....MMMMMMSSSSSSSMMMMMM.........',
  '......MMMMMMMMMMMMMMM...........',
];

const PAL_THANATOS = {
  M: '#1a0612', // dark hood
  S: '#3a1248', // mid hood purple
  K: '#0a0309', // outline
  W: '#d8c8a8', // skull bone
  C: '#5b1830', // eye socket void
};

// === LORD OF DEATH - LICH KING (Chief of Staff #5) ===
const LICH_KING = [
  '...........KKKKKKKKKK...........',
  '..........KYYYYYYYYYYK..........',
  '.........KYYBBBBBBBBYYK.........',
  '........KYYBBBBBBBBBBYYK........',
  '........KYBBBBBBBBBBBBYK........',
  '........KYBYYYYYYYYYYBYK........',
  '........KYBYWWWWWWWWYBYK........',
  '........KYBYWWWWWWWWYBYK........',
  '.........KYBYWWWWWWWWYBYK.......',
  '.........KYBYWGGWGGWWYBYK.......',
  '.........KYBYWGGWGGWWYBYK.......',
  '.........KYBYWWWWWWWWYBYK.......',
  '.........KYBYWWWGGWWWYBYK.......',
  '..........KYBYWWGGWWYBYK........',
  '...........KYBYWGGWYBYK.........',
  '............KYYBBBBYYK..........',
  '...........KKBBBBBBBBKK.........',
  '..........KKMMMMMMMMMMKK........',
  '.........KKMMMYYYYYYMMMKK.......',
  '........KKMMMMYYYYYYMMMMKK......',
  '.......KKMMMMMMMMMMMMMMMKK......',
  '......KKMMMMMMRRRRRRMMMMMKK.....',
  '.....KKMMMMMMRRGGGGRRMMMMMKK....',
  '....KKMMMMMRRRGGGGGGRRRMMMMKK...',
  '...KKMMMMMRRRRGGGGGGRRRRMMMMKK..',
  '....KKMMMMMMRRRRRRRRMMMMMMKK....',
  '.....KKMMMMMMMMMMMMMMMMMMKK.....',
  '......KKMMMMMMMMMMMMMMMMKK......',
  '........KKKMMMMMMMMMMMKKK.......',
  '..........KKK.......KKK.........',
];

const PAL_LICH = {
  K: '#0a0309',
  Y: '#d4a548', // gold crown
  B: '#a8324a', // crown jewel red
  W: '#d8c8a8', // skull bone face
  G: '#5fd66f', // green eye magic
  M: '#1a0612', // dark robe
  R: '#3a1248', // mid robe trim
};

// === KAFRA (HR) - friendly NPC clerk ===
const KAFRA = [
  '............KKKKKKKK............',
  '...........KYYYYYYYYK...........',
  '..........KYYYYYYYYYYK..........',
  '.........KYYRRRRRRRRYYK.........',
  '........KYYRWWWWWWWWRYYK........',
  '........KYRWWFFFFFFWWRYK........',
  '........KYRWFFAAAAFFWRYK........',
  '........KYRWFAACCCCAAFWRYK......',
  '.......KYRWFAAACCCCAAAFWRYK.....',
  '.......KYRWFAAOOAAOOAAFWRYK.....',
  '.......KYRWFAAOOAAOOAAFWRYK.....',
  '.......KYRWFAAAAAAAAAAFWRYK.....',
  '.......KYRWFAAAAFFAAAAFWRYK.....',
  '........KYRWFAAFFFFAAFWRYK......',
  '........KYRWFFAAFFAAFFWRYK......',
  '........KYYRWFFFFFFFFWRYYK......',
  '.........KYYRWWWWWWWWRYYK.......',
  '..........KYYRRRRRRRRYYK........',
  '...........KYYYRRRYYYYK.........',
  '...........KMMMMMMMMMMMK........',
  '..........KMBBBBBBBBBBMK........',
  '.........KMBYYYYYYYYYYBMK.......',
  '........KMBYAAAAAAAAAAYBMK......',
  '.......KMBYAAAYBYAAAYBYAYBMK....',
  '......KMBYAAYYYYAAYYYAAYAYBMK...',
  '.....KMBBYYYYYYYYYYYYYYYYYBBMK..',
  '.....KMBBBBBBBBBBBBBBBBBBBBBMK..',
  '......KMBBBB.BBBB.BBBB.BBBMK....',
  '.......KMBBB.BBBB.BBBB.BBMK.....',
  '........KKK..KKKK..KKK..KKK.....',
];
const PAL_KAFRA = {
  K: '#0a0309',
  Y: '#d4a548', // hair gold
  R: '#8a6a26', // hair shadow
  W: '#fff5d8', // skin highlight
  F: '#f0c8a0', // skin
  A: '#e0a878', // skin shadow
  C: '#3a1248', // dark interior
  O: '#5fd66f', // green eyes
  M: '#1a0612', // outline dark
  B: '#5b1830', // outfit red
};

// === VALKYRIE (CRO) - winged warrior ===
const VALKYRIE = [
  '..............YY................',
  '............YYYY................',
  '...........KKWKWWK..............',
  '..........KKWWKKWWK.............',
  '..........KWWKKKKWWK.WW.........',
  '.........KKYYYYYYYYKKWW.........',
  '.........KYYYWWWYYYYKWW.........',
  '........KYYYWAAAWYYYYK..........',
  '........KYYYWACCAWYYYK..........',
  '........KYYYWACCAWYYYK..........',
  '........KYYYWAAAWWYYYK..........',
  '........KYYYYWAAAWYYYK..........',
  '........KYYYYWAAAYYYYK..........',
  '.........KYYYYAAAYYYK...........',
  '..........KYYYYYYYYK............',
  '...........KYYYYYYK.............',
  '...........KSSSSSSK.............',
  '..........KSSWWWWSSK............',
  '.........KSSWWBBWWSSK...........',
  '..WWWWWWKSSWWBBBBWWSSK...WWWWWW.',
  '..WWWWWKSSWWBBBBBBWWSSK..WWWWWW.',
  '..WWWWWKSSSSBBBBBBSSSSK..WWWWWW.',
  '..WWWWWKSBBBBBBBBBBBSSK..WWWWWW.',
  '...WWWWKSSBBBBBBBBBBSSK..WWWWWW.',
  '....WWWKSSSBBBBBBBBSSSK..WWWWW..',
  '......KKSSSSSBBBBSSSSK...WWWW...',
  '.......KMMMMMMMMMMMMK....WWW....',
  '.......KMM........MMK....WW.....',
  '......KKMM........MMK...........',
  '......KKK..........KK...........',
];
const PAL_VALKYRIE = {
  K: '#0a0309',
  W: '#fff5d8', // wing white
  Y: '#d4a548', // gold helmet
  A: '#f0c8a0', // skin
  C: '#3a1248', // eye dark
  S: '#3a3548', // grey armor
  B: '#a8324a', // red breastplate
  M: '#1a1024', // dark cape
};

// === OSIRIS (Researcher) - mummy/pharaoh ===
const OSIRIS = [
  '............YYYYYYYY............',
  '...........YYYBBBBYYY...........',
  '..........YYYYBBBBYYYY..........',
  '.........YYBBBBBBBBBBYY.........',
  '.........YYBBYYYYYYBBYY.........',
  '........YYBBYYWWWWYYBBYY........',
  '........YBBYYWWFFWWYYBBY........',
  '........YBYYWFFAAFFWYYBY........',
  '........YBYYWFAACCAFWYYBY.......',
  '........YBYWFAACCCCAFWYBY.......',
  '........YBYWFAAOOOOAFWYBY.......',
  '........YBYWFAAOOOOAFWYBY.......',
  '........YBYWFFAAAAFFWYBY........',
  '........YBYYWFAAAAFWYYBY........',
  '........YBYYWWAAAAWWYYBY........',
  '.........YBBYYWAAWYYBBY.........',
  '..........YBBBYYYYBBBY..........',
  '...........YYBBBBBBYY...........',
  '...........YYWWYYWWYY...........',
  '..........YYWWWYYWWWYY..........',
  '.........YYWWWWYWWWWYY..........',
  '........YYWWAAAYAAAWWYY.........',
  '.......YYYWWAAAAYAAAWWYY........',
  '.......YYBBWWAAAYAAWWBBYY.......',
  '.......YYBBWWWWAYAWWWBBYY.......',
  '.......YYYBBWWWAYWWWBBYYY.......',
  '........YYYBBBBBBBBBBYYY........',
  '.........YYYBBBBBBBBYYY.........',
  '..........KKKB...BKKKK..........',
  '..........KKK....KKKK...........',
];
const PAL_OSIRIS = {
  Y: '#d4a548', // gold crown
  B: '#3a1248', // headdress dark blue
  W: '#fff5d8', // bandage white
  F: '#e0a878', // bandage shadow
  A: '#a8503a', // skin bronze
  C: '#1a0612', // mouth dark
  O: '#4ce0a0', // green eyes magic
  K: '#0a0309',
};

// === DOPPELGANGER (Sales) - shadowy mirror ===
const DOPPELGANGER = [
  '............KKKKKKKK............',
  '...........KMMMMMMMMK...........',
  '..........KMMPPPPPPMMK..........',
  '.........KMMPPRRRRPPMMK.........',
  '.........KMPPRRWWRRPPMK.........',
  '........KMMPRRWWWWRRPMMK........',
  '........KMPPRRWWGGWWRRPMK.......',
  '........KMPRRWWGGGGWWRRPMK......',
  '........KMPRRWWGGGGWWRRPMK......',
  '........KMPRRWWGWWWGWWRRPMK.....',
  '........KMPPRRWWGGWWRRPPMK......',
  '........KMMPPRRWWWWRRPPMMK......',
  '.........KMMPPRRRRPPPMMK........',
  '..........KMMPPPPPPMMK..........',
  '...........KMMMMMMMMK...........',
  '............KMMMMMMK............',
  '...........KMSSSSSSMK...........',
  '..........KMSSPPPPSSMK..........',
  '.........KMSSPRRRRPSSMK.........',
  '........KMMSSPRRRRPSSMMK........',
  '.......KMMSSSPRRRRPSSSMMK.......',
  '......KMMSSPPPPRRPPPPSSMMK......',
  '.....KMMSSPPPPPPPPPPPPSSMMK.....',
  '....KMMSSPPPPPPPPPPPPPPSSMMK....',
  '....KMSSPPPPPPPPPPPPPPPPSSMK....',
  '....KMSSPPPPPPPPPPPPPPPPSSMK....',
  '.....KMSSPPPPPPPPPPPPPPSSMK.....',
  '......KMMSSSPPPPPPPPPSSSMMK.....',
  '.......KMMSSSSPPPPPPSSSSMK......',
  '........KKKK........KKKK........',
];
const PAL_DOPPEL = {
  K: '#0a0309',
  M: '#1a0612', // outline dark
  P: '#3a1248', // dark purple skin
  R: '#5b2868', // mid purple
  W: '#7a4da8', // light purple
  G: '#fff5d8', // glowing eye
  S: '#2a1842', // cloak shadow
};

// === EDDGA (Marketing) - tiger/wild beast ===
const EDDGA = [
  '...........KKKKKKKKKKKK.........',
  '..........KOOOOOOOOOOOOK........',
  '.........KOOOOKKKOOOKKKO........',
  '........KOOKKKOOKKOKOOOOK.......',
  '........KOOKKOOOOOOOOOOOK.......',
  '.......KOOKKOOOOOOOOOOOOOK......',
  '.......KOOKOOOOOOOOOOOOOOK......',
  '.......KOKOOWWWWOOWWWWOOOK......',
  '.......KOKOWWAAWWOWWAAWWOK......',
  '.......KOKOWAACCAWOWACCAWOK.....',
  '.......KOKOWACCCCAWWACCCCAOK....',
  '.......KOKOWAACCAWOWAACCAWOK....',
  '.......KOKOOWAAAWOOOWAAAWOOK....',
  '.......KOKOOOWAAOOOOOWAAOOOK....',
  '.......KOOKKOOOAAAAAOOOOKOK.....',
  '........KOOKOOOAFFFAOOOKOK......',
  '........KOOOKOAACCCAAOKOK.......',
  '.........KOOKAACCRCCAOKO........',
  '.........KOOOACCWWWCCAOK........',
  '.........KOOOOAACCCAAOK.........',
  '..........KOOOOOAAAOOK..........',
  '..........KKOOOOOOOKK...........',
  '..........KMMMMMMMMMK...........',
  '.........KMMOOOOOOMMK...........',
  '........KMMMOOAAAAMMMK..........',
  '.......KMMMOOOAAAAOMMMK.........',
  '......KMMMOOOOAAAAOOMMK.........',
  '......KMOOOO........OOMK........',
  '......KKOO............OKK.......',
  '.......KK..............KK.......',
];
const PAL_EDDGA = {
  K: '#0a0309',
  O: '#d97a2a', // tiger orange
  W: '#fff5d8', // white face
  A: '#e8b878', // tiger fur
  C: '#1a0612', // eye/stripe dark
  R: '#a8324a', // mouth red
  F: '#3a1248', // nose
  M: '#5b1830', // outfit dark red
};

// === SAMURAI (Personal Ops) - armored bushi ===
const SAMURAI = [
  '...........KKKKKKKKKK...........',
  '...........KMMMMMMMMK...........',
  '..........KMMRRRRRRMMK..........',
  '..........KMRRRRRRRRMK..........',
  '.........KMMRRYYYYRRMMK.........',
  '.........KMRRYYYYYYRRMK.........',
  '.........KMRYYYYYYYYRMK.........',
  '........KMMRYYYYYYYYRMMK........',
  '........KMRRYBBBBBBYRRMK........',
  '........KMRYBBWWWWBBYRMK........',
  '........KMRYBWWAAAAWWBYRMK......',
  '........KMRYBWAACCAAWBYRMK......',
  '........KMRYBWAACCCAAWBYRMK.....',
  '........KMRYBWWAAAAAWWBYRMK.....',
  '........KMRYBBWWAAAWWBBYRMK.....',
  '........KMRRYBBWAAAWBBYRRMK.....',
  '.........KMRRYYBBBBYYRRMK.......',
  '..........KMMRRYYYYRRMMK........',
  '...........KMMRRRRRRMMK.........',
  '............KSSSSSSSSK..........',
  '...........KSSPPPPPPSSK.........',
  '..........KSSPPYYYYPPSSK........',
  '.........KSSSPPYYYYPPSSSK.......',
  '........KSSSSPPYYYYYPPSSSSK.....',
  '.......KSSPPPPPYYYYPPPPPSSSK....',
  '.......KSPPPPPPPYYPPPPPPSSSK....',
  '.......KSSPPPPPPPPPPPPSSSK......',
  '........KSSSPPPPPPPPSSSSK.......',
  '.........KSSSSPPPPSSSSSK........',
  '.........KKK........KKK.........',
];
const PAL_SAMURAI = {
  K: '#0a0309',
  M: '#1a0612',
  R: '#a8324a', // red lacquer
  Y: '#d4a548', // gold trim
  B: '#3a1248', // mask
  W: '#fff5d8', // face highlight
  A: '#e0a878', // skin
  C: '#1a0612', // eye
  S: '#3a3548', // grey armor
  P: '#1a1024',
};

// === TURTLE GENERAL (Admin) - shelled commander ===
const TURTLE = [
  '...........KKKKKKKKKK...........',
  '..........KGGGGGGGGGGK..........',
  '.........KGGYYYYYYYYGGK.........',
  '........KGGYGGGGGGGGYGGK........',
  '........KGYGGAAAAAGGYGK.........',
  '........KGYGAAFFFAAGYGK.........',
  '.......KGGYGAFFFFFAGYGGK........',
  '.......KGGYGAFCCCFAGYGGK........',
  '.......KGGYGAFFFFFAGYGGK........',
  '.......KGGYGGAAAAAGGYGGK........',
  '........KGYGGGGGGGGYGK..........',
  '........KGYGGGGGGGGYGK..........',
  '........KGGYYYYYYYYGGK..........',
  '.........KGGGGGGGGGGGK..........',
  '..........KGGGGGGGGGK...........',
  '...........KSSSSSSSK............',
  '..........KSSBBBBBBSSK..........',
  '.........KSSBBNNNNBBSSK.........',
  '........KSSBBNNGGNNBBSSK........',
  '.......KSSBBNNGGGGNNBBSSK.......',
  '......KSSBBNNGGYYGGNNBBSSK......',
  '......KSBBBNNGYYYYGNNBBBSK......',
  '......KSBBBNNGYYYYGNNBBBSK......',
  '......KSSBBNNGGYYGGNNBBSSK......',
  '.......KSSBBNNGGGGNNBBSSK.......',
  '........KSSBBNNGGNNBBSSK........',
  '.........KSSBBBNNBBBSSK.........',
  '..........KSSBBBBBBSSK..........',
  '...........KSSSSSSSSK...........',
  '...........KKK....KKK...........',
];
const PAL_TURTLE = {
  K: '#0a0309',
  G: '#2d6b3a', // shell green
  Y: '#d4a548', // gold trim
  A: '#e0a878', // face skin
  F: '#a8503a', // face shadow
  C: '#1a0612', // eye
  S: '#3a3548', // armor body
  B: '#5b1830', // dark cloth
  N: '#a8324a', // red accent
};

// === SATAN MORROC (Boss of Bosses) - massive crowned demon king with fire halo ===
const SATAN_MORROC = [
  '......FF................FF......',
  '....FFFF................FFFF....',
  '...FFCCFF..............FFCCFF...',
  '..FFCCCCFF............FFCCCCFF..',
  '.FFCCKKCCFF..........FFCCKKCCFF.',
  'FFCCKKKKCCFFY..YYYY..FFCCKKKKCCF',
  'FFCKKKKKKCCFYYYRRYYYYFCCKKKKKKCF',
  '.FCCKKKKCCFYYRRRRRRYYYFCCKKKKCF.',
  '..FCCKKCCFYYYRRRRRRRYYYFCCKKCF..',
  '...FCCCCFFYYRRRRDDRRRRYYFCCCCF..',
  '....FFCCFFYRRRDDDDDDRRRYFFCCFF..',
  '......FFFYYRRDDFFFFDDRRYYFFF....',
  '......YYRRDDDFFWWWWFFDDDRRYY....',
  '.....YRRRDDDFFWWAAWWFFDDDRRRY...',
  '.....YRRDDDFFWWAACCAAWWFFDDRRY..',
  '.....YRRDDDFFWAACCCCAAWFFDDRRY..',
  '.....YRRDDDFFWAACCCCAAWFFDDRRY..',
  '.....YRRDDDFFWWAACCAAWWFFDDRRY..',
  '......YRRDDDFFWWAAAAWWFFDDDRRY..',
  '......YRRDDDDFFWWAAWWFFDDDDRRY..',
  '......YRRRDDDDFFFFFFFFDDDDRRRY..',
  '.......YYRRRDDDDDDDDDDDDDRRRYY..',
  '.....YYBBYYRRRRRRRRRRRRRRRYYBBYY',
  '....BBBBBBBYYRRRGGGGGGRRRYYBBBBB',
  '...BBBBBBBBBBYYYGGYYGGYYYBBBBBBB',
  '..BBBBBBBBBBBBBYYYYYYYYBBBBBBBBB',
  '..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  '..BBBBB..BBBBBBBBBBBBBBBB..BBBBB',
  '..BBBB....BBBB.BBBB..BBBB....BBB',
  '..KKK......KKK..KKK..KKK......KK',
];
const PAL_SATAN = {
  F: '#ff8a3a', // bright orange flame halo
  C: '#ffd66a', // gold flame core
  K: '#0a0309', // black outline
  Y: '#d4a548', // gold crown
  R: '#e84561', // bright red skin
  D: '#a8324a', // mid red
  W: '#fff5d8', // skin highlight
  A: '#1a0612', // dark face shadow
  G: '#7a1a2c', // crimson armor gems
  B: '#3a1248', // dark purple cloak/wings
};

const SPRITES = {
  baphomet: { rows: DEMON_LORD, palette: PAL_DEMON },
  darklord: { rows: DARK_LORD, palette: PAL_DARK_LORD },
  amonra: { rows: AMON_RA, palette: PAL_AMON_RA },
  snakelord: { rows: SNAKE_LORD, palette: PAL_SNAKE },
  thanatos: { rows: THANATOS, palette: PAL_THANATOS },
  lichking: { rows: LICH_KING, palette: PAL_LICH },
  kafra: { rows: KAFRA, palette: PAL_KAFRA },
  valkyrie: { rows: VALKYRIE, palette: PAL_VALKYRIE },
  osiris: { rows: OSIRIS, palette: PAL_OSIRIS },
  doppelganger: { rows: DOPPELGANGER, palette: PAL_DOPPEL },
  eddga: { rows: EDDGA, palette: PAL_EDDGA },
  samurai: { rows: SAMURAI, palette: PAL_SAMURAI },
  turtle: { rows: TURTLE, palette: PAL_TURTLE },
  satanmorroc: { rows: SATAN_MORROC, palette: PAL_SATAN },
};

function BossSprite({ which, scale = 4, glow = true }) {
  const def = SPRITES[which];
  if (!def) return null;
  const w = def.rows[0].length * scale;
  const h = def.rows.length * scale;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{
        imageRendering: 'pixelated',
        filter: glow ? 'drop-shadow(0 0 12px rgba(212,165,72,0.25))' : 'none',
      }}
    >
      {gridSprite(def.rows, def.palette, scale)}
    </svg>
  );
}

window.BossSprite = BossSprite;
window.SPRITES = SPRITES;
