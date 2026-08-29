const productImageMap = {
  men: {
    shirts: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785923723/Classic_Oxford_Button-Down_Shirt_1_mxrkbs.jpg', altText: 'Men shirt front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922088/Printed_Resort_Shirt1_crim4d.jpg', altText: 'Men shirt detail view' },
    ],
    polos: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922088/Printed_Resort_Shirt_d6ttpy.jpg', altText: 'Men polo shirt front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922085/Polo_T-Shirt_with_Ribbed_Collar1_s1glj4.jpg', altText: 'Men polo shirt detail view' },
    ],
    tees: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922082/Polo_T-Shirt_with_Ribbed_Collar_noj8cb.jpg', altText: 'Men t-shirt front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922077/Oversized_Graphic_T-Shirt1_yd9bxz.jpg', altText: 'Men t-shirt detail view' },
    ],
    thermal: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922075/Oversized_Graphic_T-Shirt_c4croc.jpg', altText: 'Men thermal top front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922057/Regular-Fit_Henley_Shirt_yyzrqx.jpg', altText: 'Men thermal top detail view' },
    ],
    joggers: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Regular-Fit_Henley_Shirt_1_oqtxkm.jpg', altText: 'Men joggers front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922071/Long-Sleeve_Thermal_Tee1_yo73tx.jpg', altText: 'Men joggers detail view' },
    ],
    cargo: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922069/Long-Sleeve_Thermal_Tee_qbxxhf.jpg', altText: 'Men cargo pants front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922018/Denim_Jeans_d4zivv.jpg', altText: 'Men cargo pants detail view' },
    ],
    sweatpants: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922021/Denim_Jeans1_oipkrh.jpg', altText: 'Men sweatpants front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Relaxed_Fit_Sweatpants_pfbvre.jpg', altText: 'Men sweatpants detail view' },
    ],
    jeans: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922058/Relaxed_Fit_Sweatpants1_gie0ue.jpg', altText: 'Men jeans front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922024/Formal_Dress_Pants_dyzsfh.jpg', altText: 'Men jeans detail view' },
    ],
    chinos: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922015/Formal_Dress_Pants1_euzydx.jpg', altText: 'Men chinos front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787926304/High-Waist_Skinny_Jeans_kmzgkf.jpg', altText: 'Men chinos detail view' },
    ],
    trousers: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787926304/High-Waist_Skinny_Jeans1_hnay1i.jpg', altText: 'Men trousers front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922081/Pleated_Midi_Skirt_c6pv75.jpg', altText: 'Men trousers detail view' },
    ],
  },
  women: {
    tops: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922082/Pleated_Midi_Skirt1_uel2ja.jpg', altText: 'Women top front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922023/Flared_Palazzo_Pants_ydkwtj.jpg', altText: 'Women top detail view' },
    ],
    blouses: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922024/Flared_Palazzo_Pants_1_hl3wfu.jpg', altText: 'Women blouse front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922061/High-Rise_Joggers1_glw5zf.jpg', altText: 'Women blouse detail view' },
    ],
    tees: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922059/High-Rise_Joggers_wy3hib.jpg', altText: 'Women tee front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922079/Paperbag_Waist_Shorts1_yw3y4r.jpg', altText: 'Women tee detail view' },
    ],
    jeans: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922078/Paperbag_Waist_Shorts_qsbokl.jpg', altText: 'Women jeans front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Culottes1_mgpnol.jpg', altText: 'Women jeans detail view' },
    ],
    trousers: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Culottes_k0lfgv.jpg', altText: 'Women trousers front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Classic_Pleated_Trousers1_nmtp9v.jpg', altText: 'Women trousers detail view' },
    ],
    leggings: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787921825/Classic_Pleated_Trousers_i5ncbj.jpg', altText: 'Women leggings front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Knitted_Cropped_Top_az7sus.jpg', altText: 'Women leggings detail view' },
    ],
    skirts: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Knitted_Cropped_Top1_xooivv.jpg', altText: 'Women skirt front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922072/Off-Shoulder_Top1_zyqbvp.jpg', altText: 'Women skirt detail view' },
    ],
    shorts: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922072/Off-Shoulder_Top_g7cruz.jpg', altText: 'Women shorts front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922067/Lace-Trimmed_Cami_Top_1_kawcud.jpg', altText: 'Women shorts detail view' },
    ],
    joggers: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922066/Lace-Trimmed_Cami_Top_trwkcd.jpg', altText: 'Women joggers front view' },
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1787922017/Graphic_Print_Tee_keksbs.jpg', altText: 'Women joggers detail view' },
    ],
  },
};

export default productImageMap;
