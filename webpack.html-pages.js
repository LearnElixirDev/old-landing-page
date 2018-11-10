import HtmlWebpackPlugin from 'html-webpack-plugin'

const titleAdd = (name) => ` | ${name}`
const blogAdd = (name) => titleAdd(`Blog - ${name}`)

const getUrlPath = (url) => url.match('[^\/]+$')[0]
const prerenderParams = (url) => encodeURIComponent(JSON.stringify({string: true, params: {url}, documentUrl: getUrlPath(url)}))

const addTemplateLoaders = (indexPath, url) => {
  // if (IS_PROD)
  //   return `!!prerender-loader?${prerenderParams(url)}!pug-loader!${indexPath}`
  // else
    return `!!pug-loader!${indexPath}`
}

const createHtmlPlugin = (STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS) => (
  chunkName, filename,
  append = '', template = addTemplateLoaders('./src/index.pug', `/${chunkName}`),
  extras = {}
) => new HtmlWebpackPlugin({
  ...extras,
  NODE_ENV: process.env.NODE_ENV,
  filename,
  template,
  inject: true,
  title: `Lure${append}`,
  // excludeAssets: [/style.*.js/],
  excludeChunks: BLOG_VIEW_CHUNKS
    .concat(STATIC_ENTRY_CHUNKS)
    .filter(chunk => chunk !== chunkName),
})

const createBlogHtmlPlugin = (STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS) => (
  chunkName,
  fileName,
  title, {
    author,
    blogDescription,
    blogTitle, blogUrl,
    blogImage, blogPublishDate
  },
  template = addTemplateLoaders('./src/index.pug', blogUrl)
) => createHtmlPlugin(STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS)(
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

export const createHtmlPages = (STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS) => {
  const createPagePlugin = createHtmlPlugin(STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS)
  const createBlogPlugin = createBlogHtmlPlugin(STATIC_ENTRY_CHUNKS, BLOG_VIEW_CHUNKS)

  return [
    createPagePlugin('home', 'index.html', ` Consulting`),
    createPagePlugin('contact', 'contact.html', titleAdd('Contact')),
    createPagePlugin('process', 'process.html', titleAdd('Process')),
    createPagePlugin('quote', 'quote.html', titleAdd('Quote')),
    createPagePlugin('blog', 'blog.html', titleAdd('Blog')),
    createPagePlugin('terms-of-service', 'terms-of-service.html', titleAdd('Terms of Service')),
    createPagePlugin('privacy', 'privacy-policy.html', titleAdd('Privacy Policy')),
    createBlogPlugin(
      'dangers-of-genservers',
      'blog/elixir/dangers-of-genservers.html',
      blogAdd('Dangers of GenServers'),
      {
        blogDescription: 'At Lure, we use the latest software to bring you the best user experience. In this article, Lure CTEO Mika Kalathil outlines some of the technical details of GenServers in Elixir, which we use to serve a large multitude of people with high speed. This is a deep dive into GenServers and discovering their limitations and strengths.',
        blogTitle: 'Dangers of Genservers in Elixir',
        blogImage: 'blog-elixir-dangers-of-genservers.jpeg',
        blogUrl: 'blog/elixir/dangers-of-genservers',
        blogPublishDate: '2018-10-29T16:14:24.526Z',
        author: 'Mika Kalathil'
      }
    )
  ]
}
