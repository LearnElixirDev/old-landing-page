import path from 'path'
import pug from 'pug'
import sass from 'node-sass'
import {optimize} from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import S3Plugin from 'webpack-s3-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import {pugMixins} from './pug-mixins'

import {name as appName} from './package.json'

const rootPath = (nPath) => path.resolve(__dirname, nPath)

const {NODE_ENV = 'development'} = process.env
const IS_PROD = NODE_ENV === 'production'
const IS_TEST = NODE_ENV === 'test'
const IS_DEV = NODE_ENV === 'development'
const SRC_PATH = rootPath('src')
const DIST_PATH = rootPath('dist')

const titleAdd = (name) => ` | ${name}`
const createHtmlPlugin = (chunkName, fileName, append = '') => new HtmlWebpackPlugin({
  filename: fileName,
  template: '!!!pug-loader!./src/index.pug',
  inject: true,
  chunks: [chunkName],
  title: `Lure${append}`
})

const PLUGINS = []

if (IS_PROD) {
  PLUGINS.push(
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name]-[chunkhash].css'
    })
  )
}

if (!IS_TEST) {
  PLUGINS.push(
    createHtmlPlugin('home', 'index.html'),
    createHtmlPlugin('blog', 'blog.html', titleAdd('Blog')),
    createHtmlPlugin('contact', 'contact.html', titleAdd('Contact')),
    createHtmlPlugin('how-we-work', 'how-we-work.html', titleAdd('How We Work')),
    createHtmlPlugin('quote', 'quote.html', titleAdd('Quote'))
  )
}

export default {
  mode: IS_PROD ? 'production' : 'development',
  devtool: IS_PROD ? false : 'eval-source-map',

  entry: {
    home: './src/pages/home.js',
    blog: './src/pages/blog.js',
    contact: './src/pages/contact.js',
    'how-we-work': './src/pages/how-we-work.js',
    quote: './src/pages/quote.js',
  },

  output: {
    path: DIST_PATH,
    chunkFilename: IS_PROD ? '[name]-[contenthash].js' : '[name].js',
    filename: IS_PROD ? '[name]-[contenthash].js' : '[name].js'
  },

  module: {
    rules: [{
      test: /\.svg$/,
      use: [
        'raw-loader',
        'svgo-loader'
      ]
    }, {
      test: /\.s?css/,
      include: SRC_PATH,
      use: [
        ...(IS_PROD ? [MiniCssExtractPlugin.loader, 'css-loader'] : ['style-loader']),
        'postcss-loader',
        {loader: 'sass-loader', options: {includePaths: ['./node_modules']}}
      ]
    }, {
      test: /\.pug/,
      include: SRC_PATH,
      loader: 'svelte-loader',
      options: {
        hotReload: IS_DEV,
        preprocess: {
          markup({content, ...rest}) {
            return {code: pug.render(`${pugMixins}\n${content}`)}
          },

          style({content, attributes, filename}) {
            return new Promise((resolve, reject) => {
              sass.render({
                data: content,
                includePaths: ['src'],
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

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2
        }
      }
    },

    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: IS_PROD,
        uglifyOptions: {
          mangle: true
        }
      })
      // new OptimizeCSSAssetsPlugin({})
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
