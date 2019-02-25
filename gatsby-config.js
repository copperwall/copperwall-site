module.exports = {
    siteMetadata: {
        title: 'Copperwall Blog'
    },
    plugins: [
        'gatsby-plugin-emotion',
        'gatsby-transformer-remark',
        'gatsby-plugin-react-helmet',
        {
            resolve: 'gatsby-plugin-typography',
            options: {
                pathToConfigModule: 'src/utils/typography'
            }
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: 'src',
                path: `${__dirname}/src/`
            }
        }
    ]
}
