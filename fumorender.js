if (!("Paperdoll" in setup)) setup.Paperdoll = {};


setup.Paperdoll.fumo_checkSubsExists = async function(imgPath) {
    return await setup.Paperdoll.checkImgExists(`${imgPath}_full_gray.png`) || await setup.Paperdoll.checkImgExists(`${imgPath}_full.png`);
}

setup.Paperdoll.fumo_clotheBaseSubLayers = async function(imgPath, color, bodyClothes) {
    bodyClothes = await setup.Paperdoll.ifColorPush(`${imgPath}full`, bodyClothes, color);
    return [bodyClothes];
}

setup.Paperdoll.fumo_clotheSubLayers = async function(paperdoll, imgPath, color, bodyClothes, backClothes) {
    [bodyClothes] = await setup.Paperdoll.fumo_clotheBaseSubLayers(imgPath, color, bodyClothes);
    if (imgPath.charAt(imgPath.length - 1) !== '/') { imgPath.slice(0,-1); }
    bodyClothes.push({ "path": `${imgPath}acc.png` });
    if (await setup.Paperdoll.checkImgExists(`${imgPath}mask.png`)) {
        await paperdoll.loadMask(`${imgPath}mask.png`,'hair');
    }
    if (await setup.Paperdoll.checkImgExists(`${imgPath}clotheMask.png`)) {
        await paperdoll.loadClotheMask(`${imgPath}clotheMask.png`,'clothe');
    }
    backClothes = await setup.Paperdoll.ifColorPush(`${imgPath}back`, backClothes, color);
    return [bodyClothes, backClothes];
}

setup.Paperdoll.fumo_clotheDiffsLayer = async function(paperdoll,clothe, imgPath, mainColor, bodyClothes, backClothes) {
    for (let subName in clothe.subs) {
        if ((subName === 'color' || subName === 'color1') && (await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_full_gray.png`))) {
            continue;
        } else {
            if ((subName.indexOf('color') !== -1 || subName == "laces") && (await setup.Paperdoll.checkImgExists(`${imgPath}${subName}_full_gray.png`))) {
                [bodyClothes, backClothes] = await setup.Paperdoll.fumo_clotheSubLayers(paperdoll, `${imgPath}${subName}_`, setup.Paperdoll.colorConvert(clothe.subs[subName], "clothe"), bodyClothes, backClothes);
            } else {
                [bodyClothes, backClothes] = await setup.Paperdoll.fumo_clotheSubLayers(paperdoll, `${imgPath}${subName}/${clothe.subs[subName].replace(/ /g, '_')}_`, mainColor, bodyClothes, backClothes);
            }
        }
    }
    return [bodyClothes, backClothes];
}

setup.Paperdoll.fumo_clotheLayers = async function(paperdoll, clothes, bodyClothes, backClothes) {
    clothes = setup.Paperdoll.clothesIndex.sortClothes(clothes);
    for (let i = 0; i < clothes.length; i++) {
        let citem = setup.clothes[clothes[i].item];
        let imgPath = `res/fumoimg/clothes/${citem.category}/${clothes[i].item.replace(/ /g, '_')}/`;
        let mainColor = null;
        if (clothes[i].subs['color'] || clothes[i].subs['color1']) {
            mainColor = setup.Paperdoll.colorConvert(clothes[i].subs['color'], "clothe") || setup.Paperdoll.colorConvert(clothes[i].subs['color1'], "clothe");
        }
        // main
        [bodyClothes, backClothes] = await setup.Paperdoll.fumo_clotheSubLayers(paperdoll, imgPath, mainColor, bodyClothes, backClothes);
        // sub
        [bodyClothes, backClothes] = await setup.Paperdoll.fumo_clotheDiffsLayer(paperdoll, clothes[i], imgPath, mainColor, bodyClothes, backClothes);
    }
    return [paperdoll, bodyClothes, backClothes];
}
setup.Paperdoll.fumorender = async function(canvas) {
    // 获取当前表情
    function getCurrentExpression(stats) {
        // 优先级从上至下递减
        if (stats.Satisfaction > 700 || stats.Pain > 900) return 'sad';
        if (stats.Arousal > 800 && stats.Drunkenness > 400) return 'vampireSmile';
        if (stats.Composure > 700 && stats.Rest > 700) return 'calm';
        if (stats.Attention < 600 && stats.Arousal > 400) return 'curious';
        if (stats.Arousal > 650 && stats.Release > 700) return 'badsmile';
        return 'smile'; // 默认状态
      }
    // 生成缓存key
    let fumocacheKey = setup.Paperdoll.cache.generateKey(V.pc.clothes, V.pc);
    fumocacheKey  = "fumo_" + fumocacheKey+getCurrentExpression(V.pcneeds);

    // 检查是否有缓存
    const fumocachedCanvas = setup.Paperdoll.cache.get(fumocacheKey);
    if (fumocachedCanvas) {
        console.log('Using cached paperdoll');
        const ctx = canvas.getContext('2d');
        canvas.width = fumocachedCanvas.width;
        canvas.height = fumocachedCanvas.height;
        ctx.drawImage(fumocachedCanvas, 0, 0);

        canvas.style.transform = `scale(0.8)`;
        if (canvas.height <= 256) {
            canvas.style.imageRendering = "pixelated";
            canvas.style.imageRendering = "crisp-edges";
            canvas.style.msInterpolationMode = "nearest-neighbor";
        }
        return;
    }

    let PCLayers = {
        // 衣服后背
        "backClothes": {
            layer: -20,
            load: async function() {
                for (let i = 0; i < backClothes.length; i++) {
                    if (backClothes[i].color) await p.loadLayer(backClothes[i].path, backClothes[i].color, 'clothes');
                    else await p.loadLayer(backClothes[i].path);
                }
            }
        },
        // 后发
        "backhair": {
            layer: -10,
            load: async function() {
                await p.loadLayer(`${baseURL}hair/back/${V.pc['hair style'].replace(/ /g, '_')}.png`, setup.hair_color_table[V.pc['hair color']], 'hair');
            }
        },
        // 身体
        "body": {
            layer: 0,
            load: async function() {
                await p.loadLayer(`${baseURL}body/bodynoarms.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                await p.loadLayer(`${baseURL}body/arms.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
            }
        },
        // 头
        "head": {
            layer: 10,
            load: async function() {
                await p.loadLayer(`${baseURL}body/head.png`, setup.skin_color_table[V.pc['skin color']], 'skin');
                await p.loadLayer(`${baseURL}face/eyes.png`);
                await p.loadLayer(`${baseURL}face/iris.png`, setup.eye_color_table[V.pc['eye color']]);
                await p.loadLayer(`${baseURL}face/facial/${getCurrentExpression(V.pcneeds)}.png`);
            }
        },
        // 衣服层
        "bodyClothes": {
            layer: 60,
            load: async function() {
                for (let i = 0; i < bodyClothes.length; i++) {
                    if (bodyClothes[i].color) await p.loadLayer(bodyClothes[i].path, bodyClothes[i].color, 'clothes');
                    else await p.loadLayer(bodyClothes[i].path);
                }
            }
        },
        // 前发
        "fronthair": {
            layer: 90,
            load: async function() {
                let frontHair = V.pc['hair style'].replace(/ /g, '_') + '.png';
                if (await setup.Paperdoll.checkImgExists(`${baseURL}hair/front/${frontHair}`)) {
                    await p.loadLayer(`${baseURL}hair/front/${frontHair}`, setup.hair_color_table[V.pc['hair color']], 'hair');
                } else {
                    await p.loadLayer(`${baseURL}hair/default.png`, setup.hair_color_table[V.pc['hair color']], 'hair');
                }
            }
        }

    }
    let p = new PaperDollSystem(canvas);
    const baseURL = `res/fumoimg/`;
    // 加载人模
    await p.loadBaseModel(`${baseURL}body/bodynoarms.png`);

    V.pc.get_clothingItems_classes();
    let clothes = V.pc.clothes;
    let bodyClothes = [];
    let backClothes = [];
    [p, bodyClothes, backClothes] = await setup.Paperdoll.fumo_clotheLayers(p, clothes, bodyClothes, backClothes);

    // 其他图层插入点
    // Object.assign(PCLayers, {xxxx});

    // 后景替换插入点

    let layers = Object.keys(PCLayers).sort((a, b) => PCLayers[a].layer - PCLayers[b].layer);
    for (let layer of layers) {
        await PCLayers[layer].load();
    }

    // 前景替换插入点

    function calculateScale(x) {
        return 0.8
    }
    window.p = p;

    setTimeout(() => {
        console.log('All layers loaded, caching result');
        // p.ctx.imageSmoothingEnabled = false;
        p.draw();

        canvas.style.transform = `scale(0.8)`;
        if (p.canvas.height <= 256) {
            canvas.style.imageRendering = "pixelated";
            canvas.style.imageRendering = "crisp-edges";
            canvas.style.msInterpolationMode = "nearest-neighbor";
        }
        setup.Paperdoll.cache.set(fumocacheKey, p.canvas);
    }, 50);

    return p;
}