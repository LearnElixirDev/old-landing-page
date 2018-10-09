import path from 'path'
import pug from 'pug'
import sass from 'node-sass'
import {optimize, HashedModuleIdsPlugin} from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import S3Plugin from 'webpack-s3-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import {pugMixins} from './pug-mixins'
import Prism from 'node-prismjs'

import {name as appName} from './package.json'

const rootPath = (nPath) => path.resolve(__dirname, nPath)

const {NODE_ENV = 'development'} = process.env
const IS_PROD = NODE_ENV === 'production'
const IS_TEST = NODE_ENV === 'test'
const IS_DEV = NODE_ENV === 'development'
const SRC_PATH = rootPath('src')
const DIST_PATH = rootPath('dist')
const SASS_INCLUDES = ['src', 'node_modules']
const STATIC_ENTRY_CHUNKS = ['home', 'blog', 'contact', 'process', 'quote']
const BLOG_VIEW_CHUNKS = ['dangers-of-genservers']

const titleAdd = (name) => ` | ${name}`
const createHtmlPlugin = (
  chunkName, filename,
  append = '', template = '!!!pug-loader!./src/index.pug',
  extras = {}
) => new HtmlWebpackPlugin({
  ...extras,
  filename,
  template,
  inject: true,
  title: `Lure${append}`,
  excludeChunks: BLOG_VIEW_CHUNKS
    .concat(STATIC_ENTRY_CHUNKS)
    .filter(chunk => chunk !== chunkName),
})

const convertChunkToPath = (chunk, path) => `./src${path ? `/${path}` : ''}/${chunk}.js`
const convertToEntryPaths = (chunks, path) => chunks.reduce((acc, chunk) => {
  acc[chunk] = convertChunkToPath(chunk, path)

  return acc
}, {})

const PLUGINS = []

if (IS_PROD) {
  PLUGINS.push(
    new HashedModuleIdsPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css'
    })
  )
}

if (!IS_TEST) {
  PLUGINS.push(
    createHtmlPlugin('home', 'index.html'),
    createHtmlPlugin('contact', 'contact.html', titleAdd('Contact')),
    createHtmlPlugin('process', 'process.html', titleAdd('Process')),
    createHtmlPlugin('quote', 'quote.html', titleAdd('Quote')),
    createHtmlPlugin('blog', 'blog.html', titleAdd('Blog')),
    createHtmlPlugin(
      'dangers-of-genservers',
      'blog/elixir/dangers-of-genservers.html',
      titleAdd('Blog - Dangers of GenServers')
    )
  )
}

const ENTRY = Object.assign(
  convertToEntryPaths(STATIC_ENTRY_CHUNKS, 'pages'),
  convertToEntryPaths(BLOG_VIEW_CHUNKS, 'pages/blog-views')
)

export default {
  mode: IS_PROD ? 'production' : 'development',
  devtool: IS_PROD ? false : 'eval-source-map',
  entry: Object.assign(ENTRY, {polyfill: './src/polyfill.js'}),

  output: {
    path: DIST_PATH,
    chunkFilename: IS_PROD ? '[name].[contenthash].js' : '[name].js',
    filename: IS_PROD ? '[name].[contenthash].js' : '[name].js'
  },

  module: {
    rules: [{
      test: /\.(png|jpg|jpeg)$/,
      loader: 'file-loader'
    }, {
      test: /\.svg$/,
      use: [
        'raw-loader',
        'svgo-loader'
      ]
    }, {
      test: /\.s?css/,
      include: SRC_PATH,
      use: [
        (IS_DEV ? 'style-loader' : MiniCssExtractPlugin.loader),
        {loader: 'css-loader', options: {importLoaders: 2}},
        'postcss-loader',
        {loader: 'sass-loader', options: {includePaths: SASS_INCLUDES}}
      ]
    }, {
      test: /\.md$/,
      include: SRC_PATH,
      use: ['html-loader', {
        loader: 'markdown-loader',
        options: {
          smartypants: true,
          highlight(code, lang) {
            const language = Prism.languages[lang] || Prism.languages.autoit

            return Prism.highlight(code, language)
          }
        }
      }]
    }, {
      test: /\.pug/,
      include: SRC_PATH,
      loader: 'svelte-loader',
      options: {
        hotReload: IS_DEV,
        preprocess: {
          markup({content, ...rest}) {
            return {
              code: pug.render(`${pugMixins}\n${content}`, {
                basedir: './src',
                filename: 'x',
                doctype: 'html'
              })
            }
          },

          style({content, attributes, filename}) {
            return new Promise((resolve, reject) => {
              sass.render({
                data: content,
                includePaths: SASS_INCLUDES,
                sourceMap: true,
                outFile: 'x', // this is necessary, but is ignored
                importer(url, prev) {
                  if (/^~.*/.test(url)) {
                    const filePath = url.replace(/^~/, '')
                    const nodeModulePath = `./node_modules/${filePath}`

                    return {file: path.resolve(nodeModulePath)}
                  } else {
                    const relativeFilePath = filename.replace(new RegExp('[^\\/]+$'), '')

                    return {file: path.resolve(relativeFilePath, url)}
                  }
                }
              }, (err, result) => {
                if (err) return reject(err)

                resolve({
                  code: result.css,
                  map: result.map
                })
              })
            })
          }
        }
      }
    }, {
      test: /\.js$/,
      loader: 'babel-loader',
      include: SRC_PATH,
      query: {
        presets: [
          ['@babel/preset-env', {modules: false}]
        ],
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          ['ramda', {'useES': true}]
        ],
        sourceMap: !IS_PROD,
        cacheDirectory: true,
        compact: IS_PROD
      }
    }]
  },

  plugins: PLUGINS,

  resolve: {
    mainFields: ['svelte', 'browser', 'module', 'main'],
    modules: [SRC_PATH, rootPath('node_modules')]
  },

  optimization: !IS_PROD ? {} : {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.s?css$/,
          chunks: 'all',
          enforce: true
        },

        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        },

        common: {
          name: 'common',
          chunks: 'initial',
          minChunks: 2
        }
      }
    },

    minimizer: [
      new OptimizeCSSAssetsPlugin({}),
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
        uglifyOptions: {
          mangle: true
        }
      })
    ]
  },

  devServer: {
    progress: true,
    port: 3000,

    stats: {
      modules: false,
      warnings: true,
      children: false,
      errorDetails: true
    },

    overlay: {
      warnings: false,
      errors: true
    },

    historyApiFallback: {
      rewrites: [{
        from: /^\/.*/,
        to(context) {
          return `${context.match[0]}.html`
        }
      }]
    }
  }
}
