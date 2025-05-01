if (!("Paperdoll" in setup)) setup.Paperdoll = {};

if (!("models" in setup.Paperdoll)) setup.Paperdoll.models = {};

setup.Paperdoll.models.fumomain = {
    "name": "FumoMain",
    layer: {
        // 衣服后背
        "backClothes": {
            layer: -20,
            load: async function(content) {
                for (let i = 0; i < content.backClothes.length; i++) {
                    if (content.backClothes[i].color) await content.FMp.loadLayer(content.backClothes[i].path, content.backClothes[i].color, 'clothes');
                    else await content.FMp.loadLayer(content.backClothes[i].path);
                }
            }
        },
        // 后发
        "backhair": {
            layer: -10,
            load: async function(content) {
                let hairStyleID = V.pc['hair style'].replace(/ /g, '_');
                let hairColor = setup.hair_color_table[V.pc['hair color']];
                if (typeof hairColor === "string") {
                    await content.FMp.loadLayer(`${content.baseURL}hair/back/${hairStyleID}/full.png`, hairColor, 'hair');
                } else {
                    await content.FMp.processDualColorHair(
                        `${content.baseURL}hair/back/${hairStyleID}/full.png`,
                        `${content.baseURL}hair/back/${hairStyleID}/color2_${hairColor.type}.png`,
                        hairColor.color.color1,
                        hairColor.color.color2
                    );
                }
            }
        },
        // 身体
        "body": {
            layer: 0,
            load: async function(content) {
                await content.FMp.loadLayer(`${content.baseURL}body/bodynoarms.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                await content.FMp.loadLayer(`${content.baseURL}body/arms.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 头
        "head": {
            layer: 10,
            load: async function(content) {
                await content.FMp.loadLayer(`${content.baseURL}body/head.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                await content.FMp.loadLayer(`${content.baseURL}face/eyes.png`);
                await content.FMp.loadLayer(`${content.baseURL}face/iris.png`, setup.eye_color_table[V.pc['eye color']]);
                await content.FMp.loadLayer(`${content.baseURL}face/facial/${content.getCurrentExpression(V.pcneeds)}.png`);
            }
        },
        // 衣服层
        "bodyClothes": {
            layer: 60,
            load: async function(content) {
                for (let i = 0; i < content.bodyClothes.length; i++) {
                    if (content.bodyClothes[i].color) await content.FMp.loadLayer(content.bodyClothes[i].path, content.bodyClothes[i].color, 'clothes');
                    else await content.FMp.loadLayer(content.bodyClothes[i].path);
                }
            }
        },
        // 前发
        "fronthair": {
            layer: 90,
            load: async function(content) {
                let hairStyleID = V.pc['hair style'].replace(/ /g, '_');
                let hairColor = setup.hair_color_table[V.pc['hair color']];
                let basePath = `${content.baseURL}hair/front/${hairStyleID}/full.png`;
                if (await setup.Paperdoll.checkImgExists(basePath)) {
                    if (typeof hairColor === "string") {
                        await content.FMp.loadLayer(basePath, hairColor, 'hair');
                    } else {
                        await content.FMp.processDualColorHair(
                            basePath,
                            `${content.baseURL}hair/front/${hairStyleID}/color2_${hairColor.type}.png`,
                            hairColor.color.color1,
                            hairColor.color.color2
                        );
                    }
                } else {
                    if (typeof hairColor === "string") {
                        await content.FMp.loadLayer(`${content.baseURL}hair/front/default.png`, hairColor, 'hair');
                    } else {
                        await content.FMp.processDualColorHair(
                            `${content.baseURL}hair/front/default.png`,
                            `${content.baseURL}hair/front/default_color2_${hairColor.type}.png`,
                            hairColor.color.color1,
                            hairColor.color.color2
                        );
                    }
                }
            }
        }
    }
}