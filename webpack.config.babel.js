import path from 'path'
import glob from 'glob-all'
import pug from 'pug'
import sass from 'node-sass'
import postcss from 'postcss'
import {optimize, HashedModuleIdsPlugin} from 'webpack'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import PurgecssPlugin from 'purgecss-webpack-plugin'
import Critters from 'critters-webpack-plugin'
import S3Plugin from 'webpack-s3-plugin'
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import {pugMixins} from './pug-mixins'
import Prism from 'node-prismjs'
import SriPlugin from 'webpack-subresource-integrity'
import {BundleAnalyzerPlugin} from 'webpack-bundle-analyzer'
import WebpackPwaManifest from 'webpack-pwa-manifest'
import {GenerateSW} from 'workbox-webpack-plugin'
import ExcludeAssetsPlugin from 'webpack-exclude-assets-plugin'
import HtmlWebpackExcludeAssetsPlugin from 'html-webpack-exclude-assets-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import SitemapPlugin from 'sitemap-webpack-plugin'
import RobotstxtPlugin from 'robotstxt-webpack-plugin'

import {cond, T, always, test} from 'ramda'
import {load} from 'dotenv'

import {name as appName} from './package.json'

load()

const rootPath = (nPath) => path.resolve(__dirname, nPath)

const {NODE_ENV = 'development'} = process.env
const IS_PROD = NODE_ENV === 'production'
const IS_TEST = NODE_ENV === 'test'
const IS_DEV = NODE_ENV === 'development'
const SRC_PATH = rootPath('src')
const DIST_PATH = rootPath('dist')
const SASS_INCLUDES = ['src', 'node_modules']
const STATIC_ENTRY_CHUNKS = ['home', 'blog', 'contact', 'process', 'quote', 'terms-of-service', 'privacy']
const BLOG_VIEW_CHUNKS = ['dangers-of-genservers']

const distPath = (nPath) => path.resolve(DIST_PATH, nPath)
const srcPath = (nPath) => path.resolve(SRC_PATH, nPath)

const titleAdd = (name) => ` | ${name}`

const getUrlPath = (url) => url.match('[^\/]+$')[0]
const prerenderParams = (url) => encodeURIComponent(JSON.stringify({string: true, params: {url}, documentUrl: getUrlPath(url)}))

const addTemplateLoaders = (indexPath, url) => {
  // if (IS_PROD)
  //   return `!!prerender-loader?${prerenderParams(url)}!pug-loader!${indexPath}`
  // else
    return `!!pug-loader!${indexPath}`
}

const createHtmlPlugin = (
  chunkName, filename,
  append = '', template = addTemplateLoaders('./src/index.pug', `/${chunkName}`),
  extras = {}
) => new HtmlWebpackPlugin({
  ...extras,
  NODE_ENV,
  filename,
  template,
  inject: true,
  title: `Lure${append}`,
  // excludeAssets: [/style.*.js/],
  excludeChunks: BLOG_VIEW_CHUNKS
    .concat(STATIC_ENTRY_CHUNKS)
    .filter(chunk => chunk !== chunkName),
})

const createBlogHtmlPlugin = (
  chunkName,
  fileName,
  title, {
    author,
    blogDescription,
    blogTitle, blogUrl,
    blogImage, blogPublishDate
  },
  template = addTemplateLoaders('./src/index.pug', blogUrl)
) => createHtmlPlugin(
  chunkName,
  fileName,
  title,
  template, {
    blogDescription,
    blogTitle,
    blogImage,
    blogUrl,
    blogPublishDate,
    author
  }
)

const convertChunkToPath = (chunk, path) => `./src${path ? `/${path}` : ''}/${chunk}.js`
const convertToEntryPaths = (chunks, path) => chunks.reduce((acc, chunk) => {
  acc[chunk] = convertChunkToPath(chunk, path)

  return acc
}, {})

const PLUGINS = [] //new BundleAnalyzerPlugin({server: true})]

if (!IS_TEST) {
  PLUGINS.push(
    createHtmlPlugin('home', 'index.html', ` Consulting`),
    createHtmlPlugin('contact', 'contact.html', titleAdd('Contact')),
    createHtmlPlugin('process', 'process.html', titleAdd('Process')),
    createHtmlPlugin('quote', 'quote.html', titleAdd('Quote')),
    createHtmlPlugin('blog', 'blog.html', titleAdd('Blog')),
    createHtmlPlugin('terms-of-service', 'terms-of-service.html', titleAdd('Terms of Service')),
    createHtmlPlugin('privacy', 'privacy-policy.html', titleAdd('Privacy Policy')),
    createBlogHtmlPlugin(
      'dangers-of-genservers',
      'blog/elixir/dangers-of-genservers.html',
      titleAdd('Blog - Dangers of GenServers'),
      {
        blogDescription: 'At Lure, we use the latest software to bring you the best user experience. In this article, Lure CTEO Mika Kalathil outlines some of the technical details of GenServers in Elixir, which we use to serve a large multitude of people with high speed. This is a deep dive into GenServers and discovering their limitations and strengths.',
        blogTitle: 'Dangers of Genservers in Elixir',
        blogImage: 'assets/blog-elixir-dangers-of-genservers.jpeg',
        blogUrl: 'blog/elixir/dangers-of-genservers',
        blogPublishDate: '2018-10-29T16:14:24.526Z',
        author: 'Mika Kalathil'
      }
    )
  )
}

if (IS_PROD) {
  PLUGINS.push(
    new HashedModuleIdsPlugin(),
    new optimize.ModuleConcatenationPlugin(),
    // new ExcludeAssetsPlugin({path: ['styles.+\.js$']}),
    // new HtmlWebpackExcludeAssetsPlugin(),
    new RobotstxtPlugin({host: 'https://lure.is', sitemap: 'https://lure.is/sitemap.xml'}),

    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[name].[contenthash].css'
    }),

    // new Critters({}),

    new PurgecssPlugin({
      paths: glob.sync([srcPath('**/*')], {nodir: true}),
      whitelistPatterns: [
        /^mdc-/,
        /^tns/, /^token/, /^svelte/,
        /^markdown-body/, /^language-/
      ],
      whitelistPatternsChildren: [
        /^markdown-body/, /^language-/,
        /^token/, /^svelte/
      ]
    }),

    new SitemapPlugin('https://lure.is', [{
      path: '/',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/contact',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/process',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/quote',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/blog',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/blog/elixir/dangers-of-genservers',
      lastMod: '2018-11-01',
      changeFreq: 'weekly'
    }, {
      path: '/terms-of-service',
      lastMod: '2018-11-03',
      changeFreq: 'monthly'
    }, {
      path: '/privacy-policy',
      lastMod: '2018-11-03',
      changeFreq: 'monthly'
    }]),

    new WebpackPwaManifest({
      inject: true,
      name: 'Lure Consulting',
      short_name: 'Lure',
      description: 'Lure Consulting helps you to build the best application for your needs',
      background_color: '#FAFAFA',
      start_url: '/',
      display: 'standalone',
      theme_color: '#00C0CD',
      serviceworker: {
        src: 'sw.js',
        scope: '/',
        use_cache: false
      },
      icons: [{
        src: path.resolve('src/assets/favicon/android-chrome-512x512.png'),
        sizes: [96, 128, 192, 256, 384, 512]
      }]
    }),

    new S3Plugin({
      s3Options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'us-west-2'
      },

      s3UploadOptions: {
        Bucket: 'lure.is',
        CacheControl: cond([
          [test(/^(precache-manifest|sw).*\.js$/), always('no-cache')],
          [test(/index.html/), always('max-age=315360000, stale-while-revalidate=86400, stale-if-error=259200, no-transform, public')],
          [T, always('max-age=315360000, no-transform, public')]
        ])
      },

      cloudfrontInvalidateOptions: {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        Items: ['/*']
      }
    }),

    new SriPlugin({hashFuncNames: ['sha256', 'sha384'], enabled: true}),

    new GenerateSW({
      swDest: distPath('sw.js'),
      skipWaiting: true,
      clientsClaim: true,
      navigateFallback: '/',
      offlineGoogleAnalytics: true
    })
  )
}

const postcssRender = ({code, map}, filename) => {
  if (IS_PROD)
    return postcss().process(code, {from: filename})
      .then(({css}) => ({code: css, map}))
  else
    return Promise.resolve({code, map})
}

const sassRender = (content, filename) => new Promise((resolve, reject) => {
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

const ENTRY = Object.assign(
  convertToEntryPaths(STATIC_ENTRY_CHUNKS, 'pages'),
  convertToEntryPaths(BLOG_VIEW_CHUNKS, 'pages/blog-views')
)

export default {
  mode: IS_PROD ? 'production' : 'development',
  devtool: IS_PROD ? false : 'eval-source-map',
  entry: Object.assign({polyfill: './src/polyfill.js'}, ENTRY),

  output: {
    path: DIST_PATH,
    chunkFilename: IS_PROD ? '[name].[contenthash].js' : '[name].js',
    filename: IS_PROD ? '[name].[contenthash].js' : '[name].js',
    crossOriginLoading: IS_PROD ? 'anonymous' : false
  },

  module: {
    rules: [{
      test: /\.(png|jpg|jpeg)$/,
      use: [{
        loader: 'file-loader',
        options: {
          name: IS_PROD ? '[name].[hash].[ext]' : '[name].[ext]'
        }
      }, {
        loader: 'image-webpack-loader',
        options: {
          disable: !IS_PROD,

          webp: {
            quality: 100
          },

          mozjpeg: {
            progressive: true,
            quality: 100
          },

          pngquant: {
            quality: '90-95',
            speed: 4
          }
        }
      }]
    }, {
      test: /\.svg$/,
      use: [
        'raw-loader'
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
        emitCss: IS_PROD,
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

          style({content, filename}) {
            return sassRender(content, filename)
              .then(content => postcssRender(content, filename))
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

  plugins: [
    ...PLUGINS,
    new CopyWebpackPlugin([
      {from: srcPath('assets'), to: distPath('assets')},
      {from: srcPath('assets/favicon/favicon.ico'), to: DIST_PATH}
    ])
  ],

  resolve: {
    mainFields: ['svelte', 'browser', 'module', 'main'],
    modules: [SRC_PATH, rootPath('node_modules')]
  },

  optimization: !IS_PROD ? {} : {
    runtimeChunk: 'single',
    moduleIds: 'hashed',
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.s?css$/,
          chunks: 'all',
          enforce: true
        },

        common: {
          name: 'common',
          test: /\.(pug|js)$/,
          chunks: 'all',
          minChunks: 2,
          priority: 10
        },

        svgs: {
          name: 'svgs',
          test: /\.svg$/,
          chunks: 'all',
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
          mangle: true,

          compress: {
            passes: 3,
            toplevel: true,
            warnings: false,
            pure_getters: true,
            pure_funcs: ['console.log', 'console.debug'],
            collapse_vars: false
          },

          output: {
            beautify: false,
            wrap_iife: true,
          }
        }
      })
    ]
  },

  performance: {
    assetFilter(fileName) {
      return !/(aws.sdk|svg)/.test(fileName)
    }
  },

  devServer: {
    progress: true,
    port: 3000,

    stats: {
      modules: false,
      warnings: true,
      children: false,
      errorDetails: true,
      colors: true,
      entrypoints: false,
      chunks: false,
      cached: false,
      builtAt: false,
      chunkModules: false,
      chunkGroups: false,
      chunkOrigins: false
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
