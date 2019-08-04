/* eslint-disable @typescript-eslint/camelcase */
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-typescript',
      options: {
        // isTSX: true,
        // allExtensions: true,
      },
    },
    {
      resolve: 'gatsby-plugin-top-layout',
    },
    {
      resolve: 'gatsby-plugin-material-ui',
    },
    {
      resolve: 'gatsby-plugin-react-helmet',
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Keykapp',
        short_name: 'Keykapp',
        start_url: '/',
        background_color: '#50a5e6f',
        theme_color: '#50a5e6f',
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: 'standalone',
        icon: 'src/images/1f9e2.svg', // This path is relative to the root of the site.
        // An optional attribute which provides support for CORS check.
        // If you do not provide a crossOrigin option, it will skip CORS for manifest.
        // Any invalid keyword or empty string defaults to `anonymous`
        crossOrigin: `use-credentials`,
      },
    },
    {
      resolve: 'gatsby-plugin-offline',
    },
  ],
}
