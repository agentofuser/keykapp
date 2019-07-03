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
  ],
}
