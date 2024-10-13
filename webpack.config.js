import path from 'path'
import PugPlugin from 'pug-plugin'
import { getEntry } from './webpack/getEntry.js'
import { FOLDER_NAMES, PATHS } from './webpack/paths.js'
import ImageMinimizerPlugin from 'image-minimizer-webpack-plugin'

const sourcePath = path.join(process.cwd(), 'src')

const keepPugFolderStructure = (pathData, replacer = '') => {
    const sourceFile = pathData.filename
    const relativeFile = path.relative(sourcePath, sourceFile)
    const { dir, name } = path.parse(relativeFile)

    return `${dir.replace('assets', replacer)}/${name}[ext]`
}

const keepPugFolderStructureForMedia = (pathData) => keepPugFolderStructure(pathData, 'media')
const keepPugFolderStructureForFonts = (pathData) => keepPugFolderStructure(pathData, '')

const pagesRegex = /[\\/]pages[\\/]([\w_-]+)[\\/]/

export default async function () {
    const entry = await getEntry(PATHS.SRC.PAGES)
    const isDev = process.env.NODE_ENV === 'development'

    return {
        mode: isDev ? 'development' : 'production',
        entry: { ...entry },
        output: {
            path: PATHS.BUILD._,
            filename: (pathData) => {
                if (pagesRegex.test(pathData.filename)) {
                    const pageName = pathData.filename.match(pagesRegex)[1]
                    return `${FOLDER_NAMES.SCRIPTS.BUILD}/${pageName}.bundle.js`
                }

                const { chunk } = pathData
                return `${FOLDER_NAMES.SCRIPTS.BUILD}/${chunk.name.split('.')[0]}.bundle.js`
            },
            clean: true,
        },
        devtool: 'source-map',
        devServer: {
            static: {
                directory: PATHS.SRC._,
            },
            client: { progress: true },
            historyApiFallback: true,
            open: true,
        },
        resolve: {
            extensions: ['.js'],
            alias: {
                '@': PATHS.SRC._,
                npm: path.resolve(process.cwd(), 'node_modules'),
                assets: PATHS.SRC.ASSETS,
                globals: PATHS.SRC.GLOBALS,
                components: PATHS.SRC.COMPONENTS,
                features: PATHS.SRC.FEATURES,
                layout: PATHS.SRC.LAYOUT,
                ui: PATHS.SRC.UI,
                styles: PATHS.SRC.STYLES,
                scripts: PATHS.SRC.SCRIPTS,
                pages: PATHS.SRC.PAGES,
            },
        },
        module: {
            rules: [
                {
                    test: /\.pug$/,
                    loader: PugPlugin.loader,
                    options: { data: { isDev } },
                },
                {
                    test: /\.(css|scss|sass)$/,
                    use: ['css-loader', 'postcss-loader', 'sass-loader'],
                },
                {
                    test: /\.(png|jpg|jpeg|ico|svg|webp)/,
                    type: 'asset/resource',
                    generator: { filename: keepPugFolderStructureForMedia },
                },
                {
                    test: /\.(woff|woff2|ttf)$/i,
                    type: 'asset/resource',
                    generator: { filename: keepPugFolderStructureForFonts },
                },
                {
                    test: /\.(webm|mp4)$/i,
                    type: 'asset/resource',
                    generator: { filename: keepPugFolderStructureForMedia },
                },
            ],
        },
        plugins: [
            new PugPlugin({
                pretty: true,
                css: {
                    filename: (pathData) => {
                        if (pagesRegex.test(pathData.filename)) {
                            const pageName = pathData.filename.match(pagesRegex)[1]
                            return `${FOLDER_NAMES.STYLES.BUILD}/${pageName}.styles.css`
                        }
                        return `${FOLDER_NAMES.STYLES.BUILD}/[name].css`
                    },
                },
            }),
        ],
        optimization: {
            minimizer: [
                '...',
                new ImageMinimizerPlugin({
                    minimizer: {
                        implementation: async (original) => {
                            const inputExt = path.extname(original.filename).toLowerCase()

                            // Если это изображение НЕ webp, jpg, jpeg или png — пропускаем минификацию
                            if (['webp', 'jpg', 'jpeg', 'png'].includes(inputExt)) {
                                // Вернем без минификации
                                return null
                            }

                            return {
                                filename: original.filename,
                                data: original.data,  // Оставляем оригинальные данные без минификации
                                warnings: [...original.warnings],
                                errors: [...original.errors],
                                info: {
                                    ...original.info,
                                    minimized: false,  // Минимизация отключена
                                },
                            }
                        },
                    },
                }),
            ],
        },
    }
}
