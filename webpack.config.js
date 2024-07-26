
const path = require('path');
const glob = require('glob');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const dotenv = require('dotenv');
dotenv.config();

// Dynamically find all entry points
const entries = {
    santorini: './src/santorini/santorini.js', // Entry point for santorini bundle 
    mykonos: './src/mykonos/mykonos.js'
};
console.log(__dirname)

module.exports = {
    mode: process.env.NODE_ENV,
    entry: { main: './index.js', ...entries },
    output: {
        filename: (pathData) => {
            const entryName = pathData.chunk.name;
            return entryName === 'main' ? `${entryName}.bundle.js` : `src/${entryName}/${entryName}.bundle.js`;
        }, // Output file names based on entry names
        path: path.resolve(__dirname, 'dist'), // Output directory path
        // sourceMapFilename: (pathData) => {
        //     const entryName = pathData.chunk.name;
        //     return `src/${entryName}/${entryName}.min.js.map`;
        // }
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Apply this rule to all files ending in .js
                exclude: /node_modules/, // Exclude node_modules directory
                use: {
                    loader: 'babel-loader', // Use Babel to transpile JavaScript
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'] // Babel presets for ES6+ and React
                    }
                }
            },
            {
                test: /\.css$/, // Apply this rule to all files ending in .css
                use: [
                    'style-loader', // Inject CSS into the DOM
                    'css-loader' // Load CSS files
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'] // Resolve these extensions without needing to specify them in imports
    },
    devtool: 'source-map', // Generate source maps for easier debugging
    devServer: {
        contentBase: path.join(__dirname, 'dist'), // Serve files from the 'dist' directory
        compress: true, // Enable gzip compression
        port: 9000, // Port to run the development server on
        historyApiFallback: {
            rewrites: [
                { from: /^\/santorini$/, to: `/src/santorini/santorini.html` },
                { from: /^\/mykonos$/, to: `/src/mykonos/mykonos.html` }
            ]
        }
    },
    watch: true,
    plugins: [
        new CleanWebpackPlugin(),
        new BrowserSyncPlugin({
            host: 'localhost',
            port: process.env.PORT,
            server: { baseDir: ['dist'] },
            files: ['./dist/*'],
            notify: false,
            middleware: [
                function (req, res, next) {
                    // Handle redirects
                    if (req.url.startsWith('/src/')) {
                        const entry = req.url.split('/')[2]; // Extract the entry name
                        if (Object.keys(entries).includes(entry)) {
                            res.writeHead(301, { Location: `/${entry}` });
                            res.end();
                        } else {
                            next(); // Not an entry point, continue
                        }
                    } else if (Object.keys(entries).includes(req.url.substring(1))) {
                        // Handle rewriting of /entry to /src/entry/entry.html
                        req.url = `/src/${req.url.substring(1)}/${req.url.substring(1)}.html`;
                        next();
                    } else {
                        next(); // No special handling, continue
                    }
                }
            ]
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            // favicon: 'favicon.ico',
            template: 'index.html'
        }),
        ...Object.keys(entries).map(entry => new HtmlWebpackPlugin({
            filename: `src/${entry}/${entry}.html`,
            template: `./src/${entry}/${entry}.html`,
            chunks: [entry]
        })),
    ],
};
