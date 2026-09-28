// The current edition: one artist, one artwork, one year. When the year closes the
// anniversary map is unveiled and the line passes to the next artist.
//
// Everything about the artist below comes from public sources listed in docs/VISION.md.
// The platform shows the edition *after* the artwork ("d'après"); the artist's real
// signature and any reproduction of the original need her written licence first.

export const EDITION = {
  code: 'LV01',
  number: 1,
  artist: {
    name: 'Miryan Klein',
    born: 'Lyon, 1951',
    studios: 'Nice (Mont-Boron, previously Cimiez) and Normandy',
    practice:
      'Self-taught painter and sculptor. Works with "poor" and contemporary materials, above all neon and fibre optics, in "no painting" pieces where light replaces pigment.',
  },
  artwork: {
    title: 'Ligne de Vie',
    translation: 'Line of Life',
    place: 'Rue Gubernatis, by Square Durandy, Nice',
    context: 'Commissioned by the City of Nice for the tram line 2 construction hoardings.',
    description:
      'Photographs of about twenty anonymous hands, hers among them, run along some hundred metres of street. The life line of each palm is joined to the next by a translucent thread of energy, forming one long line of life, echoing the tram line that also connects people to one another.',
  },
  manifesto: [
    'Every gift has a hand behind it.',
    'Every hand holds a line.',
    'Every line reaches the next one.',
  ],
  opens: '2026-01-15', // demo dates: the pilot edition's year
  closes: '2027-01-14',
  next: 'Edition 02: the line passes to a new artist on the anniversary.',
};
