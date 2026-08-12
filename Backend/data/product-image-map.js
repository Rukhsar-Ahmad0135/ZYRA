const productImageMap = {
  men: {
    shirts: [
      { url: 'https://res.cloudinary.com/dab9s1yeq/image/upload/v1785923723/Classic_Oxford_Button-Down_Shirt_1_mxrkbs.jpg', altText: 'Men shirt front view' },
      { url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&h=500&fit=crop', altText: 'Men shirt detail view' },
    ],
    polos: [
      { url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&h=500&fit=crop', altText: 'Men polo shirt front view' },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Men polo shirt detail view' },
    ],
    tees: [
      { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=500&fit=crop', altText: 'Men t-shirt front view' },
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', altText: 'Men t-shirt detail view' },
    ],
    thermal: [
      { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop', altText: 'Men thermal top front view' },
      { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=500&fit=crop', altText: 'Men thermal top detail view' },
    ],
    joggers: [
      { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&h=500&fit=crop', altText: 'Men joggers front view' },
      { url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=500&fit=crop', altText: 'Men joggers detail view' },
    ],
    cargo: [
      { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=500&fit=crop', altText: 'Men cargo pants front view' },
      { url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500&h=500&fit=crop', altText: 'Men cargo pants detail view' },
    ],
    sweatpants: [
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop', altText: 'Men sweatpants front view' },
      { url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop', altText: 'Men sweatpants detail view' },
    ],
    jeans: [
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop', altText: 'Men jeans front view' },
      { url: 'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=500&h=500&fit=crop', altText: 'Men jeans detail view' },
    ],
    chinos: [
      { url: 'https://images.unsplash.com/photo-1473968643109-aa3b32f9c9d8?w=500&h=500&fit=crop', altText: 'Men chinos front view' },
      { url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&h=500&fit=crop', altText: 'Men chinos detail view' },
    ],
    trousers: [
      { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop', altText: 'Men trousers front view' },
      { url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop', altText: 'Men trousers detail view' },
    ],
  },
  women: {
    tops: [
      { url: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=500&h=500&fit=crop', altText: 'Women top front view' },
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', altText: 'Women top detail view' },
    ],
    blouses: [
      { url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=500&h=500&fit=crop', altText: 'Women blouse front view' },
      { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop', altText: 'Women blouse detail view' },
    ],
    tees: [
      { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop', altText: 'Women tee front view' },
      { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop', altText: 'Women tee detail view' },
    ],
    jeans: [
      { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop', altText: 'Women jeans front view' },
      { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop', altText: 'Women jeans detail view' },
    ],
    trousers: [
      { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=500&fit=crop', altText: 'Women trousers front view' },
      { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop', altText: 'Women trousers detail view' },
    ],
    leggings: [
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Women leggings front view' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', altText: 'Women leggings detail view' },
    ],
    skirts: [
      { url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=500&h=500&fit=crop', altText: 'Women skirt front view' },
      { url: 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=500&h=500&fit=crop', altText: 'Women skirt detail view' },
    ],
    shorts: [
      { url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&h=500&fit=crop', altText: 'Women shorts front view' },
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', altText: 'Women shorts detail view' },
    ],
    joggers: [
      { url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop', altText: 'Women joggers front view' },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop', altText: 'Women joggers detail view' },
    ],
  },
};

export default productImageMap;
