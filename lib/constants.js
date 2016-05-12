// Subheader signatures
const SUBH_ROWSIZE = Buffer.from([0xF7, 0xF7, 0xF7, 0xF7]);
const SUBH_COLSIZE = Buffer.from([0xF6, 0xF6, 0xF6, 0xF6]);
const SUBH_COLTEXT = Buffer.from([0xFD, 0xFF, 0xFF, 0xFF]);
const SUBH_COLATTR = Buffer.from([0xFC, 0xFF, 0xFF, 0xFF]);
const SUBH_COLNAME = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]);
const SUBH_COLLABS = Buffer.from([0xFE, 0xFB, 0xFF, 0xFF]);
//const SUBH_COLLIST = Buffer.from([0xFE, 0xFF, 0xFF, 0xFF]);
//const SUBH_SUBHCNT = Buffer.from([0x00, 0xFC, 0xFF, 0xFF]);

// Page types
const PAGE_META = [0];
const PAGE_DATA = [256]; // 1<<8
const PAGE_MIX = [512, 640]; // 1<<9,1<<9|1<<7
const PAGE_AMD = [1024]; // 1<<10
const PAGE_METC = [16384]; // 1<<14 (compressed data)
const PAGE_COMP = [-28672]; // ~(1<<14|1<<13|1<<12)
const PAGE_MIX_DATA = PAGE_MIX.concat(PAGE_DATA);
const PAGE_META_MIX_AMD = PAGE_META.concat(PAGE_MIX, PAGE_AMD);
const PAGE_ANY = PAGE_META_MIX_AMD.concat(PAGE_DATA, PAGE_METC, PAGE_COMP);

const MAGIC_NUMBER = Buffer.from([0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0xc2, 0xea, 0x81, 0x60, 0xb3, 0x14, 0x11, 0xcf, 0xbd, 0x92, 0x8, 0x0, 0x9, 0xc7, 0x31, 0x8c, 0x18, 0x1f, 0x10, 0x11]);

module.exports = {
    SUBH_ROWSIZE,
    SUBH_COLSIZE,
    SUBH_COLTEXT,
    SUBH_COLATTR,
    SUBH_COLNAME,
    SUBH_COLLABS,
    PAGE_META,
    PAGE_DATA,
    PAGE_MIX,
    PAGE_AMD,
    PAGE_METC,
    PAGE_COMP,
    PAGE_MIX_DATA,
    PAGE_META_MIX_AMD,
    PAGE_ANY,
    MAGIC_NUMBER
};
