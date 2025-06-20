import plugin from '../../../../lib/plugins/plugin.js';
import fs from 'fs';
import path from 'path';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import puppeteer from '/root/Yunzai/lib/puppeteer/puppeteer.js';
import Show from '../../model/show.js';


/**
 * 全局
 */
//插件根目录
const __dirname =
	path.resolve() + path.sep + 'plugins' + path.sep + 'xiuxian-emulator-plugin';
// 文件存放路径
export const __PATH = {
	//更新日志
	updata_log_path: path.join(__dirname, 'A版本补丁目录.txt'),
	//用户数据
	player_path: path.join(__dirname, '/resources/data/xiuxian_player'),
	//装备
	equipment_path: path.join(__dirname, '/resources/data/xiuxian_equipment'),
	//纳戒
	najie_path: path.join(__dirname, '/resources/data/xiuxian_najie'),
	//源数据
	lib_path: path.join(__dirname, '/resources/data/item'),
	Timelimit: path.join(__dirname, '/resources/data/Timelimit'),
	Forum: path.join(__dirname, '/resources/data/Exchange'),
	Exchange: path.join(__dirname, '/resources/data/Forum'),
	mingdang: path.join(__dirname, '/resources/data/mingdang'),
	mingdang_log: path.join(__dirname, '/resources/data/mingdang'),
	shop: path.join(__dirname, '/resources/data/shop'),
	log_path: path.join(__dirname, '/resources/data/suduku'),
	cangbaoge: path.join(__dirname, '/resources/data'),
	association: path.join(__dirname, '/resources/data/association'),
	tiandibang: path.join(__dirname, '/resources/data/tiandibang'),
	qinmidu: path.join(__dirname, '/resources/data/qinmidu'),
	backup: path.join(__dirname, '/resources/backup'),
	player_pifu_path: path.join(__dirname, '/resources/img/player_pifu'),
	shitu: path.join(__dirname, '/resources/data/shitu'),
	renwu: path.join(__dirname, '/resources/data/renwu'),
    map: path.join(__dirname, '/resources/data/map'),
	equipment_pifu_path: path.join(__dirname, '/resources/img/equipment_pifu'),
	temp_path: path.join(__dirname, '/resources/data/temp'),
};
let xiuxianSetFile =
	'./plugins/xiuxian-emulator-plugin/config/xiuxian/xiuxian.yaml';
if (!fs.existsSync(xiuxianSetFile)) {
	fs.copyFileSync(
		'./plugins/xiuxian-emulator-plugin/defSet/xiuxian/xiuxian.yaml',
		xiuxianSetFile
	);
}

//处理消息
export class xiuxian extends plugin {
	constructor() {
		super({
			name: 'xiuxian',
			dsc: '修仙模块',
			event: 'message',
			priority: 800,
			rule: [],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}
}

const 体质概率 = 0.2;
const 伪灵根概率 = 0.37;
const 真灵根概率 = 0.29;
const 天灵根概率 = 0.08;
const 圣体概率 = 0.005;
const 变异灵根概率 =
	1 - 体质概率 - 伪灵根概率 - 真灵根概率 - 天灵根概率 - 圣体概率;

//检查存档是否存在，存在返回true;
export async function existplayer(usr_qq) {
	let exist_player;
	exist_player = fs.existsSync(`${__PATH.player_path}/${usr_qq}.json`);
	if (exist_player) {
		return true;
	}
	return false;
}
/**
 *
 * @param {*} data 物品
 * @returns 0可赠送、拍卖等；1不可赠送、拍卖等。
 */
export async function Check_thing(data) {
	let state = 0;
	if (data.id >= 5005000 && data.id <= 5005009) {
		state = 1;
	}if (data.id >= 400982 && data.id <= 400989) {
		state = 1;
	} else if (data.id >= 400991 && data.id <= 400999) {
		state = 1;
	}
	return state;
}

/**
 *
 * @param {*} amount 输入数量
 * @returns 返回正整数
 */
export async function convert2integer(amount) {
	let number = 1;
	let reg = new RegExp(/^[1-9]\d*$/);
	if (!reg.test(amount)) {
		return number;
	} else {
		return amount;
	}
}

export async function Read_updata_log() {
	let dir = path.join(`${__PATH.updata_log_path}`);
	let update_log = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	return update_log;
}

//读取存档信息，返回成一个JavaScript对象
export async function Read_player(usr_qq) {
    try {
        const dir = path.join(__PATH.player_path, `${usr_qq}.json`);
        
        // 检查文件是否存在
        if (!fs.existsSync(dir)) {
            console.error(`File not found: ${dir}`);
            return 'error';
        }
        
        // 读取文件内容
        const data = fs.readFileSync(dir, 'utf8');
        
        // 打印调试信息
        // console.log(`Reading file: ${dir}`);
        // console.log(`File content: ${data}`);
        
        // 解析 JSON 数据
        const player = JSON.parse(data);
        return player;
    } catch (err) {
        console.error(`Error reading player data for QQ ${usr_qq}: ${err}`);
        return 'error';
    }
}

//写入存档信息,第二个参数是一个JavaScript对象
export async function Write_player(usr_qq, player) {
	let dir = path.join(__PATH.player_path, `${usr_qq}.json`);
	let new_ARR = JSON.stringify(player, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}

//读取装备信息，返回成一个JavaScript对象
export async function Read_equipment(usr_qq) {
	let dir = path.join(`${__PATH.equipment_path}/${usr_qq}.json`);
	let equipment = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	equipment = JSON.parse(equipment);
	return equipment;
}

//写入装备信息,第二个参数是一个JavaScript对象
export async function Write_equipment(usr_qq, equipment) {
	//每次写入都要更新新的攻防生
	//
	let player = await Read_player(usr_qq);
	player.幸运 = player.addluckyNo
	if (equipment.项链.属性 == '幸运') player.幸运 += equipment.项链.加成
	if (player.仙宠.type == '幸运')player.幸运 +=  player.仙宠.加成
	if (player.额外幸运) player.幸运 +=  player.额外幸运
	player.幸运 = Number((player.幸运).toFixed(5))
  
	if (!isNotNull(player.level_id)) {
		await e.reply('请先#一键同步');
		return;
	}
	let equ_atk =
		equipment.武器.atk + equipment.护具.atk + equipment.法宝.atk + player.攻击加成;
	let equ_def =
		equipment.武器.def + equipment.护具.def + equipment.法宝.def + player.防御加成;
	let equ_HP =
		equipment.武器.HP + equipment.护具.HP + equipment.法宝.HP + player.生命加成;
	let equ_bao = equipment.武器.bao + equipment.护具.bao + equipment.法宝.bao;
	let attack = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).基础攻击;
	attack =
		attack +
		player.镇妖塔层数 * 100 +
		data.LevelMax_list.find((item) => item.level_id == player.Physique_id).基础攻击;
	let blood = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).基础血量;
	blood =
		blood +
		player.神魄段数 * 5000 +
		data.LevelMax_list.find((item) => item.level_id == player.Physique_id).基础血量;
	let defense = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).基础防御;
	defense =
		defense +
		player.神魄段数 * 100 +
		data.LevelMax_list.find((item) => item.level_id == player.Physique_id).基础防御;
	let strike = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).基础暴击;
	player['攻击'] = equ_atk + attack;
	player['防御'] = equ_def + defense;
	player['血量上限'] = equ_HP + blood;
	player['暴击率'] = equ_bao + strike;
	if (player['暴击率'] <= 1) {
		player['暴击伤害'] = equ_bao + strike + 1.5;
	} else {
		player['暴击伤害'] = 2.5;
	}

	if (!isNotNull(player.仙宠)) {
	} else if (player.仙宠.type == '暴伤') {
		if (player['暴击率'] <= 1) {
			player['暴击伤害'] = equ_bao + strike + 1.5 + player.仙宠.加成;
		} else {
			player['暴击伤害'] = 2.5 + player.仙宠.加成;
		}
	}
	let shenqi = false;
	if(
		equipment.武器.name == "磐岩结绿" ||
		equipment.武器.name == "贯虹之槊" ||
		equipment.武器.name == "护摩之杖" ||
		equipment.武器.name == "雾切之回光" ||
		equipment.武器.name == "苍古自由之誓" ||
		equipment.武器.name == "终末嗟叹之诗" ||
		equipment.武器.name == "赤角石溃杵"
	){
		shenqi = true;
	}
	if (
		equipment.武器.name == '灭仙剑' &&
		equipment.法宝.name == '灭仙符' &&
		equipment.护具.name == '灭仙衣' &&
		player.魔道值 > 999
	) {
		player.攻击 = Math.trunc(1.15 * player.攻击);
	}
	if (
		equipment.武器.name == '诛仙枪' &&
		equipment.法宝.name == '诛仙花' &&
		equipment.护具.name == '诛仙甲' &&
		player.魔道值 > 999
	) {
		player.攻击 = Math.trunc(1.05 * player.攻击);
		player.血量上限 = Math.trunc(1.2 * player.血量上限);
	}
	if (
		equipment.武器.name == '下界合金剑' &&
		equipment.护具.name == '下界合金甲' &&
		equipment.法宝.name == '下界合金头盔'
	) {
		player.攻击 = Math.trunc(1.3 * player.攻击);
		player.血量上限 = Math.trunc(1.3 * player.血量上限);
		player.防御 = Math.trunc(1.3 * player.防御);
	}
	if (
		equipment.武器.name == '光明剑' &&
		equipment.法宝.name == '光明符' &&
		equipment.护具.name == '光明衣' &&
		player.魔道值 < 1 &&
		(player.灵根.type == '转生' || player.level_id > 41)
	) {
		player.攻击 = Math.trunc(1.15 * player.攻击);
	}
	if (
		equipment.武器.name == '神月剑' &&
		equipment.法宝.name == '神日花' &&
		equipment.护具.name == '神星甲' &&
		player.魔道值 < 1 &&
		(player.灵根.type == '转生' || player.level_id > 41)
	) {
		player.攻击 = Math.trunc(1.05 * player.攻击);
		player.血量上限= Math.trunc(1.2 * player.血量上限);
	}
	if (equipment.武器.name == "鸡神之剑" && 
		equipment.法宝.name == "鸡神之盔" && 
		equipment.护具.name == "鸡神之甲" && 
		player.灵根.type == "鸡根"
	) {
		player.攻击 = Math.trunc((1.2 * player.攻击)+(0.03 * player.血量上限));
		//player.攻击 = Math.trunc(1.2 * player.攻击);
		player.防御上限= Math.trunc(1.5 * player.防御上限);
	}
	if (
		shenqi &&
		(equipment.法宝.name == "下界合金头盔" || equipment.法宝.name == "智识之冠") &&
		(equipment.护具.name == "千岩牢固" || equipment.护具.name == "下界合金甲") &&
		player.灵根.type == "元素灵根"
	) {
		player.攻击 = Math.trunc(1.05 * player.攻击);
		player.血量上限 = Math.trunc(1.2 * player.血量上限);
		player.防御 = Math.trunc(1.05 * player.防御);

	}
	await Write_player(usr_qq, player);
	await Add_HP(usr_qq, 0);
	let dir = path.join(__PATH.equipment_path, `${usr_qq}.json`);
	let new_ARR = JSON.stringify(equipment, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}

//读取纳戒信息，返回成一个JavaScript对象
export async function Read_najie(usr_qq) {
	let dir = path.join(`${__PATH.najie_path}/${usr_qq}.json`);
	let najie = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	najie = JSON.parse(najie);
	return najie;
}

//写入纳戒信息,第二个参数是一个JavaScript对象
export async function Write_najie(usr_qq, najie) {
	let dir = path.join(__PATH.najie_path, `${usr_qq}.json`);
	let new_ARR = JSON.stringify(najie, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}

//修为数量和灵石数量正增加,负减少
//使用时记得加await
export async function Add_灵石(usr_qq, 灵石数量 = 0) {
	let player = await Read_player(usr_qq);
	player.灵石 += Math.trunc(灵石数量);
	await Write_player(usr_qq, player);
	return;
}

export async function Add_幸运(usr_qq, 幸运 = 0) {
	let player = await Read_player(usr_qq);
	player.幸运 += 幸运;
	if (!player.额外幸运) player.额外幸运 = 0
	player.额外幸运 += 幸运;
	await Write_player(usr_qq, player);
	return;
}

export async function Add_热量(usr_qq, 热量 = 0) {
	let player = await Read_player(usr_qq);
	player.热量 += Math.trunc(热量);
	await Write_player(usr_qq, player);
	return;
}

export async function Add_修为(usr_qq, 修为数量 = 0) {
	let player = await Read_player(usr_qq);
	player.修为 += Math.trunc(修为数量);
	await Write_player(usr_qq, player);
	return;
}
export async function Add_魔道值(usr_qq, 魔道值 = 0) {
	let player = await Read_player(usr_qq);
	player.魔道值 += Math.trunc(魔道值);
	await Write_player(usr_qq, player);
	return;
}
export async function Add_饱食度(usr_qq, 饱食度 = 0) {
	let player = await Read_player(usr_qq);
	player.饱食度 += Math.trunc(饱食度);
	await Write_player(usr_qq, player);
	return;
}
export async function Add_血气(usr_qq, 血气 = 0) {
	let player = await Read_player(usr_qq);
	player.血气 += Math.trunc(血气);
	await Write_player(usr_qq, player);
	return;
}
export async function change_神之心(usr_qq) {
	let player = await Read_player(usr_qq);
	player.灵根 = await get_神之心_random();
	data.setData('player', usr_qq, player);
	await player_efficiency(usr_qq);
	return;
}
export async function Add_HP(usr_qq, blood = 0) {
	let player = await Read_player(usr_qq);
	player.当前血量 += Math.trunc(blood);
	if (player.当前血量 > player.血量上限) {
		player.当前血量 = player.血量上限;
	}
	if (player.当前血量 < 0) {
		player.当前血量 = 0;
	}
	await Write_player(usr_qq, player);
	return;
}
/**
 *
 * @param {*} usr_qq 用户qq
 * @param {*} exp 经验值
 * @returns
 */
export async function Add_职业经验(usr_qq, exp = 0) {
	let player = await Read_player(usr_qq);
	if (exp == 0) {
		return;
	}
	exp = player.occupation_exp + exp;
	let level = player.occupation_level;
	while (true) {
		let need_exp = data.occupation_exp_list.find(
			(item) => item.id == level
		).experience;
		if (need_exp > exp) {
			break;
		} else {
			exp -= need_exp;
			level++;
		}
	}
	player.occupation_exp = exp;
	player.occupation_level = level;
	await Write_player(usr_qq, player);
	return;
}

export async function Add_najie_灵石(usr_qq, lingshi) {
	let najie = await Read_najie(usr_qq);
	najie.灵石 += Math.trunc(lingshi);
	await Write_najie(usr_qq, najie);
	return;
}

export async function Add_player_学习功法(usr_qq, gongfa_name) {
	let player = await Read_player(usr_qq);
	player.学习的功法.push(gongfa_name);
	data.setData('player', usr_qq, player);
	await player_efficiency(usr_qq);
	return;
}

export async function Reduse_player_学习功法(usr_qq, gongfa_name) {
	let player = await Read_player(usr_qq);
	Array.prototype.remove = function (v) {
		for (let i = 0, j = 0; i < this.length; i++) {
			if (this[i] != v) {
				this[j++] = this[i];
			}
		}
		this.length -= 1;
	};
	player.学习的功法.remove(gongfa_name);
	data.setData('player', usr_qq, player);
	await player_efficiency(usr_qq);
	return;
}

//---------------------------------------------分界线------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//修炼效率综合
export async function player_efficiency(usr_qq) {
	//这里有问题
	let player = await data.getData('player', usr_qq); //修仙个人信息
	let ass;
	let Assoc_efficiency; //宗门效率加成
	let linggen_efficiency; //灵根效率加成
	let gongfa_efficiency = 0; //功法效率加成
	let xianchong_efficiency = 0; // 仙宠效率加成
	if (!isNotNull(player.宗门)) {
		//是否存在宗门信息
		Assoc_efficiency = 0; //不存在，宗门效率为0
	} else {
		ass = await data.getAssociation(player.宗门.宗门名称); //修仙对应宗门信息
		if (ass.宗门驻地 == 0) {
			Assoc_efficiency = ass.宗门等级 * 0.05;
		} else {
			let dongTan = await data.bless_list.find((item) => item.name == ass.宗门驻地);
			Assoc_efficiency = ass.宗门等级 * 0.05 + dongTan.level * 0.1;
		}
	}
	if (!isNotNull(player.灵根)) {
		//是否存在灵根，判断老存档
		player.灵根 = await get_random_talent(); //不存在灵根，获取灵根
	}
	linggen_efficiency = player.灵根.eff; //灵根修炼速率
	if (!isNotNull(player.学习的功法)) {
		//是否存在功法
		gongfa_efficiency = 0; //不存在功法，功法效率为0
	} else {
		for (var i = 0; i < player.学习的功法.length; i++) {
			//存在功法，遍历功法加成
			let gongfa_name = player.学习的功法[i];
			//这里是查看了功法表
			let ifexist2;
			try {
				ifexist2 = data.gongfa_list.find((item) => item.name == gongfa_name);
				if (ifexist2 == undefined) {
					ifexist2 = data.timegongfa_list.find((item) => item.name == gongfa_name);
				}
			} catch {
				ifexist2 = data.timegongfa_list.find((item) => item.name == gongfa_name);
			}
			//如果表里不存在这个功法了
			if (!ifexist2) {
				//找到这个功法的位置
				let ceshi = player.学习的功法.indexOf(gongfa_name);
				//删除这个位置
				if (ceshi > -1) {
					player.学习的功法.splice(ceshi, 1);
				}
				//删除完成后删除
				break;
			}
			//如果存在就是合理了
			gongfa_efficiency += ifexist2.修炼加成;
		}
	}
	if (player.仙宠.type == '修炼') {
		// 是否存在修炼仙宠
		xianchong_efficiency = player.仙宠.加成; // 存在修炼仙宠，仙宠效率为仙宠效率加成
	}
	if (parseInt(player.修炼效率提升) != parseInt(player.修炼效率提升)) {
		player.修炼效率提升 = 0;
	}
	let bgdan = 0;
	let action = await redis.get('xiuxian:player:' + 10 + ':biguang');
	action = await JSON.parse(action);
	if (action != null) {
		for (i = 0; i < action.length; i++) {
			if (action[i].qq == usr_qq) {
				bgdan = action[i].biguanxl;
				break;
			}
		}
	}
	if (parseInt(player.修炼效率提升) != parseInt(player.修炼效率提升)) {
		player.修炼效率提升 = 0;
	}
	player.修炼效率提升 =
		linggen_efficiency +
		Assoc_efficiency +
		gongfa_efficiency +
		xianchong_efficiency +
		bgdan; //修炼效率综合
	data.setData('player', usr_qq, player);
	return;
}
/**
 *
 * @param {*} usr_qq 玩家qq
 * @param {*} thing_name 物品名
 * @param {*} thing_class 物品类别
 * @param {*} thing_pinji 可选参数，装备品阶，数字0-6等
 * @returns 物品数量或者false
 */
//检查纳戒内物品是否存在
//判断物品
//要用await
export async function exist_najie_thing(
	usr_qq,
	thing_name,
	thing_class,
	thing_pinji = null
) {
	let najie = await Read_najie(usr_qq);
	if (!isNotNull(najie.草药)) {
		najie.草药 = [];
		await Write_najie(usr_qq, najie);
	}
	if (!isNotNull(najie.食材)) {
		najie.食材 = [];
		await Write_najie(usr_qq, najie);
	}
	if (!isNotNull(najie.盒子)) {
		najie.盒子 = [];
		await Write_najie(usr_qq, najie);
	}
	let ifexist;
	if (thing_class == '装备') {
		if (thing_pinji == null) {
			ifexist = najie.装备.find((item) => item.name == thing_name);
		} else {
			ifexist = najie.装备.find(
				(item) => item.name == thing_name && item.pinji == thing_pinji
			);
		}
	}
	if (thing_class == '丹药') {
		ifexist = najie.丹药.find((item) => item.name == thing_name);
	}
	if (thing_class == '道具') {
		ifexist = najie.道具.find((item) => item.name == thing_name);
	}
	if (thing_class == '功法') {
		ifexist = najie.功法.find((item) => item.name == thing_name);
	}
	if (thing_class == '草药') {
		ifexist = najie.草药.find((item) => item.name == thing_name);
	}
	if (thing_class == '材料') {
		ifexist = najie.材料.find((item) => item.name == thing_name);
	}
	if (thing_class == '食材') {
		ifexist = najie.食材.find((item) => item.name == thing_name);
	}
	if (thing_class == '盒子') {
		ifexist = najie.盒子.find((item) => item.name == thing_name);
	}
	if (thing_class == '仙宠') {
		ifexist = najie.仙宠.find((item) => item.name == thing_name);
	}
	if (thing_class == '仙米') {
		ifexist = najie.仙宠口粮.find((item) => item.name == thing_name);
	}
	if (ifexist) {
		return ifexist.数量;
	}
	return false;
}
/**
 *
 * @param {*} usr_qq 用户qq
 * @param {*} thing_name 物品名
 * @param {*} thing_class 物品类别
 * @param {*} thing_pinji 品级 数字0-6
 * @returns
 */
///检查纳戒内物品是否锁定
//判断物品
//要用await
export async function Locked_najie_thing(
	usr_qq,
	thing_name,
	thing_class,
	thing_pinji = null
) {
	let najie = await Read_najie(usr_qq);
	if (!isNotNull(najie.草药)) {
		najie.草药 = [];
		await Write_najie(usr_qq, najie);
	}
	if (!isNotNull(najie.盒子)) {
		najie.盒子 = [];
		await Write_najie(usr_qq, najie);
	}
	let ifexist;
	if (thing_class == '装备') {
		ifexist = najie.装备.find(
			(item) => item.name == thing_name && item.pinji == thing_pinji
		);
	}
	if (thing_class == '丹药') {
		ifexist = najie.丹药.find((item) => item.name == thing_name);
	}
	if (thing_class == '道具') {
		ifexist = najie.道具.find((item) => item.name == thing_name);
	}
	if (thing_class == '功法') {
		ifexist = najie.功法.find((item) => item.name == thing_name);
	}
	if (thing_class == '草药') {
		ifexist = najie.草药.find((item) => item.name == thing_name);
	}
	if (thing_class == '材料') {
		ifexist = najie.材料.find((item) => item.name == thing_name);
	}
	if (thing_class == '食材') {
		ifexist = najie.食材.find((item) => item.name == thing_name);
	}
	if (thing_class == '盒子') {
		ifexist = najie.盒子.find((item) => item.name == thing_name);
	}
	if (thing_class == '仙宠') {
		ifexist = najie.仙宠.find((item) => item.name == thing_name);
	}
	if (thing_class == '仙米') {
		ifexist = najie.仙宠口粮.find((item) => item.name == thing_name);
	}
	if (ifexist) {
		return ifexist.islockd;
	}
	return false;
}
//修改纳戒物品锁定状态
export async function re_najie_thing(
	usr_qq,
	thing_name,
	thing_class,
	thing_pinji,
	lock
) {
	let najie = await Read_najie(usr_qq);
	if (thing_class == '装备' && (thing_pinji || thing_pinji == 0)) {
		for (let i of najie['装备']) {
			if (i.name == thing_name && i.pinji == thing_pinji) i.islockd = lock;
		}
	} else {
		for (let i of najie[thing_class]) {
			if (i.name == thing_name) i.islockd = lock;
		}
	}
	await Write_najie(usr_qq, najie);
	return true;
}
/**
 * 增加减少纳戒内物品
 * @param usr_qq 操作存档的qq号
 * @param thing_name  物品名称
 * @param thing_class  物品类别
 * @param n  操作的数量,取+增加,取 -减少
 * @param pinji 品级 数字0-6
 * @returns 无
 */
export async function Add_najie_thing(
	usr_qq,
	thing_name,
	thing_class,
	n,
	pinji = null
) {
	var x = n;
	if (x == 0) {
		return;
	}
	x = Number(x);
	let najie = await Read_najie(usr_qq);
	var name = thing_name;
	if (!isNotNull(najie.草药)) {
		//判断老存档有没有草药字段
		najie.草药 = [];
	}
	if (!isNotNull(najie.食材)) {
		//判断老存档有没有草药字段
		najie.食材 = [];
	}

	if (!isNotNull(najie.盒子)) {
		//判断老存档有没有草药字段
		najie.盒子 = [];
	}
	//写入
	await Write_najie(usr_qq, najie);
	let exist = await exist_najie_thing(usr_qq, name, thing_class);
	//这部分写得很冗余,但能跑
	if (thing_class == '装备') {
		//失败
		// if (x > 0 && !exist) {//无中生有
		// let equipment = data.equipment_list.find(item => item.name == name);
		// if (equipment == undefined) {
		// equipment = data.timeequipmen_list.find(item => item.name == name);
		// najie.装备.push(equipment);
		// } else {
		// najie.装备.push(equipment);
		// }
		// najie.装备.find(item => item.name == name).数量 = x;
		// await Write_najie(usr_qq, najie);
		// return;
		// }
		if (x > 0) {
			if (pinji == null || pinji == undefined) {
				let random = Math.floor(Math.random());
				if (random > 0.99) {
					//1%
					pinji = 6;
				}
				if (random < 0.99 && random > 0.95) {
					//4%
					pinji = 5;
				}
				if (random < 0.95 && random > 0.6) {
					//35%
					pinji = 4;
				}
				if (random < 0.6 && random > 0.2) {
					//40%
					pinji = 3;
				} else {
					//21%,0到2每个概率相等
					pinji = Math.floor(Math.random() * 3);
				}
			}
			let e = await najie.装备.find(
				(item) => item.name == name && item.pinji == pinji
			);
			if (!isNotNull(e)) {
				let z = [0.8, 1, 1.1, 1.2, 1.3, 1.5, 2.0][pinji];
				var equipment = data.equipment_list.find((item) => item.name == name);
				if (!isNotNull(equipment)) {
					equipment = data.timeequipmen_list.find((item) => item.name == name);
				}
				//for(let i=0;i<x;i++){
				let equipment0 = JSON.parse(JSON.stringify(equipment));
				equipment0.pinji = pinji;
				if (isNotNull(equipment0.加成)) {
					equipment0.加成 = Number((equipment.加成 * z).toFixed(2));
					if (equipment0.加成 == 0) {
						equipment0.加成 = 0.1;
					}
				} else {
					equipment0.atk = Math.floor(equipment.atk * z);
					equipment0.def = Math.floor(equipment.def * z);
					equipment0.HP = Math.floor(equipment.HP * z);
				}
				equipment0.数量 = x;
				equipment0.islockd = 0;
				najie.装备.push(equipment0);
				//}
				await Write_najie(usr_qq, najie);
				return;
			}
			e.数量 += x;
			await Write_najie(usr_qq, najie);
			return;
		}
		if (pinji == null || pinji == undefined) {
			if (isNotNull(najie.装备.find((item) => item.name == name).数量)) {
				najie.装备.find((item) => item.name == name).数量 += x;
			} else {
				najie.装备.find((item) => item.name == name).数量 = x;
			}
		} else {
			najie.装备.find((item) => item.name == name && item.pinji == pinji).数量 += x;
		}
		najie.装备 = najie.装备.filter((item) => item.数量 > 0);
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '丹药') {
		if (x > 0 && !exist) {
			//无中生有
			let daoyao =
				data.danyao_list.find((item) => item.name == name) ||
				data.newdanyao_list.find((item) => item.name == name);
			if (daoyao == undefined) {
				daoyao = data.timedanyao_list.find((item) => item.name == name);
				najie.丹药.push(daoyao);
			} else {
				najie.丹药.push(daoyao);
			}
			console.log(daoyao);
			console.log(najie.丹药.find((item) => item.name == name));
			najie.丹药.find((item) => item.name == name).数量 = x;
			najie.丹药.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.丹药.find((item) => item.name == name).数量 += x;
		if (najie.丹药.find((item) => item.name == name).数量 < 1) {
			najie.丹药 = najie.丹药.filter((item) => item.name != name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '道具') {
		if (x > 0 && !exist) {
			//无中生有
			let daoju = data.daoju_list.find((item) => item.name == name);
			najie.道具.push(daoju);
			najie.道具.find((item) => item.name == name).数量 = x;
			najie.道具.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.道具.find((item) => item.name == name).数量 += x;
		if (najie.道具.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.道具 = najie.道具.filter((item) => item.name != name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '功法') {
		if (x > 0 && !exist) {
			//无中生有
			let gonfa =
				data.gongfa_list.find((item) => item.name == name) ||
				data.homegongfa_list.find((item) => item.name == name);
			if (gonfa == undefined) {
				gonfa = data.timegongfa_list.find((item) => item.name == name);
				najie.功法.push(gonfa);
			} else {
				najie.功法.push(gonfa);
			}
			najie.功法.find((item) => item.name == name).数量 = x;
			najie.功法.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.功法.find((item) => item.name == name).数量 += x;
		if (najie.功法.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.功法 = najie.功法.filter((item) => item.name != name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '草药') {
		if (x > 0 && !exist) {
			//无中生有
			najie.草药.push(data.caoyao_list.find((item) => item.name == name));
			najie.草药.find((item) => item.name == name).数量 = x;
			najie.草药.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.草药.find((item) => item.name == name).数量 += x;
		if (najie.草药.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.草药 = najie.草药.filter((item) => item.name != thing_name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '材料') {
		if (x > 0 && !exist) {
			//无中生有
			najie.材料.push(data.cailiao_list.find((item) => item.name == name));
			najie.材料.find((item) => item.name == name).数量 = x;
			najie.材料.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.材料.find((item) => item.name == name).数量 += x;
		if (najie.材料.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.材料 = najie.材料.filter((item) => item.name != thing_name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '食材') {
		if (x > 0 && !exist) {
			//无中生有
			najie.食材.push(data.shicai_list.find((item) => item.name == name));
			najie.食材.find((item) => item.name == name).数量 = x;
			najie.食材.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.食材.find((item) => item.name == name).数量 += x;
		if (najie.食材.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.食材 = najie.食材.filter((item) => item.name != thing_name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '盒子') {
		if (x > 0 && !exist) {
			//无中生有
			najie.盒子.push(data.hezi_list.find((item) => item.name == name));
			najie.盒子.find((item) => item.name == name).数量 = x;
			najie.盒子.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.盒子.find((item) => item.name == name).数量 += x;
		if (najie.盒子.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.盒子 = najie.盒子.filter((item) => item.name != thing_name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '仙宠') {
		if (x > 0 && !exist) {
			//无中生有
			najie.仙宠.push(data.xianchon.find((item) => item.name == name));
			najie.仙宠.find((item) => item.name == name).数量 = x;
			najie.仙宠.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		if(usr_qq == 9536826149557637141|| usr_qq == 8139893750449888096 || usr_qq == 18236763786415097341){
			console.log(najie.仙宠.find((item) => item.name == name));
		}
		najie.仙宠.find((item) => item.name == name).数量 += x;
		if (najie.仙宠.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.仙宠 = najie.仙宠.filter((item) => item.name != thing_name);
		}
		if(usr_qq == 9536826149557637141|| usr_qq == 8139893750449888096 || usr_qq == 18236763786415097341){
			console.log(najie.仙宠);
			return;
		}
		await Write_najie(usr_qq, najie);
		return;
	}
	if (thing_class == '仙米') {
		if (x > 0 && !exist) {
			//无中生有
			najie.仙宠口粮.push(data.xianchonkouliang.find((item) => item.name == name));
			najie.仙宠口粮.find((item) => item.name == name).数量 = x;
			najie.仙宠口粮.find((item) => item.name == name).islockd = 0;
			await Write_najie(usr_qq, najie);
			return;
		}
		najie.仙宠口粮.find((item) => item.name == name).数量 += x;
		if (najie.仙宠口粮.find((item) => item.name == name).数量 < 1) {
			//假如用完了,需要删掉数组中的元素,用.filter()把!=该元素的过滤出来
			najie.仙宠口粮 = najie.仙宠口粮.filter((item) => item.name != thing_name);
		}
		await Write_najie(usr_qq, najie);
		return;
	}
}

//替换装备
export async function instead_equipment(usr_qq, equipment_data) {
	let player = await Read_player(usr_qq);
	if (player.血量上限 + equipment_data.HP < 0) {
		console.log('无法装备');
		return;
	}
	//装备name
	await Add_najie_thing(
		usr_qq,
		equipment_data.name,
		'装备',
		-1,
		equipment_data.pinji
	);
	//下面出错，找到了
	let thing_type;
	let equipment;
	let najie;
	let thing_name;
	try {
		//根据名字找类型
		//thing_type = data.equipment_list.find(item => item.name == thing_name).type;
		thing_type = equipment_data.type;
		//读装备
		equipment = await Read_equipment(usr_qq);
		najie = await Read_najie(usr_qq);
		if (thing_type == '武器') {
			//把读取装备，把武器放回戒指
			await Add_najie_thing(
				usr_qq,
				equipment.武器.name,
				'装备',
				1,
				equipment.武器.pinji
			);
			//根据名字找武器
			//equipment.武器 = data.equipment_list.find(item => item.name == thing_name);
			equipment.武器 = equipment_data;

			//武器写入装备
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '护具') {
			await Add_najie_thing(
				usr_qq,
				equipment.护具.name,
				'装备',
				1,
				equipment.护具.pinji
			);
			//equipment.护具 = data.equipment_list.find(item => item.name == thing_name);
			equipment.护具 = equipment_data;
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '法宝') {
			await Add_najie_thing(
				usr_qq,
				equipment.法宝.name,
				'装备',
				1,
				equipment.法宝.pinji
			);
			//equipment.法宝 = data.equipment_list.find(item => item.name == thing_name);
			equipment.法宝 = equipment_data;
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '项链') {
			await Add_najie_thing(
				usr_qq,
				equipment.项链.name,
				'装备',
				1,
				equipment.项链.pinji
			);
			//equipment.法宝 = data.equipment_list.find(item => item.name == thing_name);
			equipment.项链 = equipment_data;
			await Write_equipment(usr_qq, equipment);
			return;
		}
	} catch {
		thing_type = data.timeequipmen_list.find(
			(item) => item.name == thing_name
		).type;
		equipment = await Read_equipment(usr_qq);
		if (thing_type == '武器') {
			//把读取装备，把武器放回戒指
			await Add_najie_thing(
				usr_qq,
				equipment.武器.name,
				'装备',
				1,
				equipment.武器.pinji
			);
			//根据名字找武器，
			equipment.武器 = data.timeequipmen_list.find((item) => item.name == thing_name);
			//把武器装备起来
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '护具') {
			await Add_najie_thing(
				usr_qq,
				equipment.护具.name,
				'装备',
				1,
				equipment.护具.pinji
			);
			equipment.护具 = data.timeequipmen_list.find((item) => item.name == thing_name);
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '法宝') {
			await Add_najie_thing(
				usr_qq,
				equipment.法宝.name,
				'装备',
				1,
				equipment.法宝.pinji
			);
			//equipment.法宝 = data.equipment_list.find(item => item.name == thing_name);
			equipment.法宝 = data.timeequipmen_list.find((item) => item.name == thing_name);
			await Write_equipment(usr_qq, equipment);
			return;
		}
		if (thing_type == '项链') {
			await Add_najie_thing(usr_qq, equipment.项链.name, '装备', 1);
			equipment.项链 = data.necklace_list.find((item) => item.name == thing_name);
			await Write_equipment(usr_qq, equipment);
			return;
		}
	}
	return;
}

/*
player ={
    攻击:123,
    防御:123,
    当前血量:123,
    暴击率:0.123,
    名号:"ABC",
    qq:123,
    法球倍率: 0.02
}
*/
export async function Getmsg_battle(A_player, B_player) {
	let now_A_HP = A_player.当前血量; //保留初始血量方便计算最后扣多少血,避免反复读写文件
	let now_B_HP = B_player.当前血量;
	let A_xue = 0; //最后要扣多少血
	let B_xue = 0;
	let cnt = 0; //回合数
	let msg = [];
	let afangyu = A_player.防御; //记录A原防御
	let bfangyu = B_player.防御; //记录B原防御
	let aATK = A_player.攻击; //记录A原攻击
	let bATK = B_player.攻击; //记录B原攻击
	let Agandianhuihe = 0; //感电燃烧回合数
	let Bgandianhuihe = 0; //感电燃烧回合数
	let Achaodaohuihe = 0; //超导回合数
	let Bchaodaohuihe = 0; //超导回合数
	while (A_player.当前血量 > 0 && B_player.当前血量 > 0) {
		if (cnt % 2 == 0) {
			let baoji = baojishanghai(A_player.暴击率);
			if (!isNotNull(A_player.仙宠)) {
				//判断有无仙宠
			} else if (A_player.仙宠.type == '暴伤') {
				baoji = baojishanghai(A_player.暴击率) + A_player.仙宠.加成;
			}
			let 伤害 = Harm(A_player.攻击, B_player.防御);
			let 法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
			伤害 = Math.trunc(baoji * 伤害 + 法球伤害);
			let 持续伤害 = 0;
			let yuansu = await Gaodenyuansulun(
				A_player,
				B_player,
				aATK,
				msg,
				cnt,
				Agandianhuihe,
				Achaodaohuihe
			);
			Agandianhuihe = yuansu.gandianhuihe;
			Achaodaohuihe = yuansu.chaodaohuihe2;
			A_player = yuansu.A_player;
			B_player = yuansu.B_player;
			if (yuansu.ranshao && Agandianhuihe > 0) {
				持续伤害 = Math.trunc(伤害 * 0.15);
				Agandianhuihe -= 1;
				B_player.当前血量 -= 持续伤害;
				msg.push(B_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
			}
			if (yuansu.gandian && Agandianhuihe > 0) {
				持续伤害 = Math.trunc(伤害 * 0.15);
				Agandianhuihe -= 1;
				B_player.当前血量 -= 持续伤害;
				msg.push(B_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
			}
			if (yuansu.chaodao && Achaodaohuihe > 0) {
				Achaodaohuihe -= 1;
				msg.push(
					B_player.名号 + '的抗性大大下降,虚弱状态剩余' + Achaodaohuihe + '回合'
				);
				B_player.防御 *= 0.5;
			}
			if (yuansu.fyjiachen != 0) {
				A_player.防御 += yuansu.fyjiachen;
			}
			msg = yuansu.msg;
			cnt = yuansu.cnt;
			let 新伤害 = Harm(A_player.攻击, B_player.防御);
			let 新法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
			新伤害 = Math.trunc(baoji * 新伤害 + 新法球伤害);
			B_player.当前血量 -= 新伤害;
			B_player.防御 = bfangyu;
			if (B_player.当前血量 < 0) {
				B_player.当前血量 = 0;
			}
			let Random = Math.random();
			if (cnt == 0) {
				msg.push(`你趁怪物不注意，先手一刀`);
				伤害 *= 0.6;
			}
			msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${A_player.名号}攻击了${B_player.名号}，${ifbaoji(baoji)}造成伤害${新伤害}，${
				B_player.名号
			}剩余血量${B_player.当前血量}`);
		}
		if (cnt % 2 == 1) {
			let baoji = baojishanghai(B_player.暴击率);
			if (!isNotNull(B_player.仙宠)) {
				//判断有无仙宠
			} else if (B_player.仙宠.type == '暴伤') {
				baoji = baojishanghai(B_player.暴击率) + B_player.仙宠.加成;
			}
			let 伤害 = Harm(B_player.攻击, A_player.防御);
			let 法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
			伤害 = Math.trunc(baoji * 伤害 + 法球伤害);
			let 持续伤害 = 0;
			let yuansu = await Gaodenyuansulun(
				B_player,
				A_player,
				bATK,
				msg,
				cnt,
				Bgandianhuihe,
				Bchaodaohuihe
			);
			Bgandianhuihe = yuansu.gandianhuihe;
			Bchaodaohuihe = yuansu.chaodaohuihe2;
			A_player = yuansu.B_player;
			B_player = yuansu.A_player;
			console.log(Bgandianhuihe + '被打起方' + yuansu.ranshao);
			if (yuansu.ranshao && Bgandianhuihe > 0) {
				持续伤害 = Math.trunc(伤害 * 0.15);
				Bgandianhuihe -= 1;
				A_player.当前血量 -= 持续伤害;
				msg.push(A_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
			}
			if (yuansu.gandian && Bgandianhuihe > 0) {
				持续伤害 = Math.trunc(伤害 * 0.15);
				Bgandianhuihe -= 1;
				A_player.当前血量 -= 持续伤害;
				msg.push(A_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
			}
			if (yuansu.chaodao && Bchaodaohuihe > 0) {
				Bchaodaohuihe -= 1;
				msg.push(
					A_player.名号 + '的抗性大大下降,虚弱状态剩余' + Bchaodaohuihe + '回合'
				);
				A_player.防御 *= 0.5;
			}
			if (yuansu.fyjiachen != 0) {
				B_player.防御 += yuansu.fyjiachen;
			}
			msg = yuansu.msg;
			cnt = yuansu.cnt;
			let 新伤害 = Harm(B_player.攻击, A_player.防御);
			let 新法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
			新伤害 = Math.trunc(baoji * 新伤害 + 新法球伤害);
			A_player.当前血量 -= 新伤害;
			A_player.防御 = afangyu;
			if (A_player.当前血量 < 0) {
				A_player.当前血量 = 0;
			}
			msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${B_player.名号}攻击了${A_player.名号}，${ifbaoji(baoji)}造成伤害${新伤害}，${
				A_player.名号
			}剩余血量${A_player.当前血量}`);
		}
		cnt++;
	}
	if (A_player.当前血量 <= 0) {
		msg.push(`${B_player.名号}击败了${A_player.名号}`);
		B_xue = B_player.当前血量 - now_B_HP;
		A_xue = -now_A_HP;
	}
	if (B_player.当前血量 <= 0) {
		msg.push(`${A_player.名号}击败了${B_player.名号}`);
		B_xue = -now_B_HP;
		A_xue = A_player.当前血量 - now_A_HP;
	}
	//剃掉加成
	A_player.防御 = afangyu;
	B_player.防御 = bfangyu;
	A_player.攻击 = aATK;
	B_player.攻击 = bATK;
	let Data_nattle = {
		msg: msg,
		A_xue: A_xue,
		B_xue: B_xue,
	};
	return Data_nattle;
}

export async function TEXT_battle(A_player, B_player) {
	let now_A_HP = A_player.当前血量; //保留初始血量方便计算最后扣多少血,避免反复读写文件
	let now_B_HP = B_player.当前血量;
	let A_xue = 0; //最后要扣多少血
	let B_xue = 0;
	let cnt = 0; //回合数
	let msg = [];
	let afangyu = A_player.防御; //记录A原防御
	let bfangyu = B_player.防御; //记录B原防御
	let aATK = A_player.攻击; //记录A原攻击
	let bATK = B_player.攻击; //记录B原攻击
	let Agandianhuihe = 0; //感电燃烧回合数
	let Bgandianhuihe = 0; //感电燃烧回合数
	let Achaodaohuihe = 0; //超导回合数
	let Bchaodaohuihe = 0; //超导回合数
	while (A_player.当前血量 > 0 && B_player.当前血量 > 0) {
		if (cnt % 2 == 0) {
			let baoji = baojishanghai(A_player.暴击率);
			if (!isNotNull(A_player.仙宠)) {
				//判断有无仙宠
			} else if (A_player.仙宠.type == '暴伤') {
				baoji = baojishanghai(A_player.暴击率) + A_player.仙宠.加成;
			}
			let 伤害 = Harm(A_player.攻击, B_player.防御);
			let 法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
			let 持续伤害 = 0;
			伤害 = Math.trunc(baoji * 伤害 + 法球伤害);
			let yuansu = await Gaodenyuansulun(
				A_player,
				B_player,
				aATK,
				msg,
				cnt,
				Agandianhuihe,
				Achaodaohuihe
			);
			Agandianhuihe = yuansu.gandianhuihe;
			Achaodaohuihe = yuansu.chaodaohuihe2;
			A_player = yuansu.A_player;
			B_player = yuansu.B_player;
			if (yuansu.ranshao) {
				持续伤害 = 伤害 * 0.15;
				Agandianhuihe -= 1;
				B_player.当前血量 -= 持续伤害;
				msg.push(B_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
			}
			if (yuansu.gandian) {
				持续伤害 = 伤害 * 0.15;
				Agandianhuihe -= 1;
				B_player.当前血量 -= 持续伤害;
				msg.push(B_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
			}
			if (yuansu.chaodao) {
				Achaodaohuihe -= 1;
				msg.push(B_player.名号 + '的抗性大大下降');
				B_player.防御 *= 0.8;
			}
			if (yuansu.fyjiachen != 0) {
				A_player.防御 += yuansu.fyjiachen;
			}
			msg = yuansu.msg;
			cnt = yuansu.cnt;
			let 新伤害 = Harm(A_player.攻击, B_player.防御);
			let 新法球伤害 = Math.trunc(A_player.攻击 * A_player.法球倍率);
			新伤害 = Math.trunc(baoji * 新伤害 + 新法球伤害);
			B_player.当前血量 -= 新伤害;
			B_player.防御 = bfangyu;
			if (B_player.当前血量 < 0) {
				B_player.当前血量 = 0;
			}
			let Random = Math.random();
			if (cnt == 0) {
				msg.push(`先手一刀`);
				新伤害 *= 0.6;
			}
			msg.push(
				`第${Math.trunc(cnt / 2) + 1}回合：\n${A_player.名号}攻击了${
					B_player.名号
				}，${ifbaoji(baoji)}造成伤害${新伤害}，${B_player.名号}剩余血量${
					B_player.当前血量
				}`
			);
		}
		if (cnt % 2 == 1) {
			let baoji = baojishanghai(B_player.暴击率);
			if (!isNotNull(B_player.仙宠)) {
				//判断有无仙宠
			} else if (B_player.仙宠.type == '暴伤') {
				baoji = baojishanghai(B_player.暴击率) + B_player.仙宠.加成;
			}
			let 伤害 = Harm(B_player.攻击, A_player.防御);
			let 法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
			伤害 = Math.trunc(baoji * 伤害 + 法球伤害);
			let 持续伤害 = 0;
			let yuansu = await Gaodenyuansulun(
				B_player,
				A_player,
				bATK,
				msg,
				cnt,
				Bgandianhuihe,
				Bchaodaohuihe
			);
			Bgandianhuihe = yuansu.gandianhuihe;
			Bchaodaohuihe = yuansu.chaodaohuihe2;
			A_player = yuansu.B_player;
			B_player = yuansu.A_player;
			if (yuansu.ranshao) {
				持续伤害 = 伤害 * 0.15;
				Bgandianhuihe -= 1;
				A_player.当前血量 -= 持续伤害;
				msg.push(A_player.名号 + '烧了起来,受到了' + 持续伤害 + '的燃烧伤害');
			}
			if (yuansu.gandian) {
				持续伤害 = 伤害 * 0.15;
				Bgandianhuihe -= 1;
				A_player.当前血量 -= 持续伤害;
				msg.push(A_player.名号 + '触电了,受到了' + 持续伤害 + '的感电伤害');
			}
			if (yuansu.chaodao) {
				Bchaodaohuihe -= 1;
				msg.push(A_player.名号 + '的抗性大大下降');
				A_player.防御 *= 0.8;
			}
			if (yuansu.fyjiachen != 0) {
				B_player.防御 += yuansu.fyjiachen;
			}
			msg = yuansu.msg;
			cnt = yuansu.cnt;
			let 新伤害 = Harm(B_player.攻击, A_player.防御);
			let 新法球伤害 = Math.trunc(B_player.攻击 * B_player.法球倍率);
			新伤害 = Math.trunc(baoji * 新伤害 + 新法球伤害);
			A_player.当前血量 -= 新伤害;
			A_player.防御 = afangyu;
			if (A_player.当前血量 < 0) {
				A_player.当前血量 = 0;
			}
			msg.push(`第${Math.trunc(cnt / 2) + 1}回合：
${B_player.名号}攻击了${A_player.名号}，${ifbaoji(baoji)}造成伤害${新伤害}，${
				A_player.名号
			}剩余血量${A_player.当前血量}`);
		}
		cnt++;
	}
	if (A_player.当前血量 <= 0) {
		msg.push(`${B_player.名号}击败了${A_player.名号}`);
		B_xue = B_player.当前血量 - now_B_HP;
		A_xue = -now_A_HP;
	}
	if (B_player.当前血量 <= 0) {
		msg.push(`${A_player.名号}击败了${B_player.名号}`);
		B_xue = -now_B_HP;
		A_xue = A_player.当前血量 - now_A_HP;
	}
	//剃掉加成
	A_player.防御 = afangyu;
	B_player.防御 = bfangyu;
	A_player.攻击 = aATK;
	B_player.攻击 = bATK;
	let Data_nattle = {
		msg: msg,
		A_xue: A_xue,
		B_xue: B_xue,
	};
	return Data_nattle;
}

export async function Gaodenyuansulun(
	A_player,
	B_player,
	last_att,
	msg,
	cnt,
	Agandianhuihe,
	chaodaohuihe
) {
	let yuansu = [
		'仙之心·火',
		'仙之心·水',
		'仙之心·雷',
		'仙之心·岩',
		'仙之心·冰',
		'仙之心·风',
		'仙之心·木',
	];
	/*let shenshi = [
		'神识·精神',
		
	];*/
	let att = last_att; //最终伤害,last_att为原伤害
	let fyjiachen = 0; //防御加成
	//AB灵根

	let A_lin = A_player.灵根.name;
	let B_lin = B_player.灵根.name;
	let chufa = false; //是否触发
	let huihe = false; //是否触发增加回合
	//特殊反应
	let ranshao = false;
	let donjie = false;
	let gandian = false;
	let chaodao = false;
	//超导回合数
	let chaodaohuihe2 = Number(chaodaohuihe);
	//燃烧感电回合数
	let gandianhuihe = Number(Agandianhuihe);
	//回合数
	let cnt6 = Number(cnt);
	let usr_qq = A_player.id;
	let B_qq = B_player.id;
	if (!isNotNull(usr_qq) || !isNotNull(B_qq)) {
		let fanyin = {
			A_player: A_player,
			B_player: B_player,
			msg: msg,
			att: att,
			fyjiachen: fyjiachen,
			chufa: chufa,
			cnt: cnt6,
			gandianhuihe: gandianhuihe,
			chaodaohuihe2: chaodaohuihe2,
			chaodao: chaodao,
			ranshao: ranshao,
			gandian: gandian,
		};
		return fanyin;
	}
	let dir = path.join(`${__PATH.equipment_path}/${usr_qq}.json`);
	let equipment = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	let dir1 = path.join(`${__PATH.equipment_path}/${B_qq}.json`);
	let B = fs.readFileSync(dir1, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	equipment = JSON.parse(equipment);
	B = JSON.parse(B);
	if (donjie) {
		//冻结
		cnt6++;
	}
	if (ranshao || gandian) {
		//感电燃烧
		gandianhuihe += 3;
	}
	if (chaodao) {
		//超导
		chaodaohuihe2 += 3;
	}
	//燃烧
	if (A_lin == yuansu[0] && B_lin == yuansu[6]) {
		ranshao = true;
	}
	if (A_lin == yuansu[0] && equipment.武器.fumo == '草') {
		ranshao = true;
	}
	if (A_lin == yuansu[6] && B_lin == yuansu[0]) {
		ranshao = true;
	}
	if (A_lin == yuansu[6] && equipment.武器.fumo == '火') {
		ranshao = true;
	}

	//感电
	if (A_lin == yuansu[1] && B_lin == yuansu[2]) {
		gandian = true;
	}
	if (A_lin == yuansu[1] && equipment.武器.fumo == '雷') {
		gandian = true;
	}
	if (A_lin == yuansu[2] && B_lin == yuansu[1]) {
		gandian = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '火') {
		gandian = true;
	}
	//超导
	if (A_lin == yuansu[2] && B_lin == yuansu[4]) {
		chaodao = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '冰') {
		chaodao = true;
	}
	if (A_lin == yuansu[4] && B_lin == yuansu[2]) {
		chaodao = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '雷') {
		chaodao = true;
	}
	if (chaodaohuihe > 0 && !chaodao) {
		chaodao = true;
	}
	A_player.攻击 = att;

	//火元素
	if (A_lin == yuansu[0]) {
		//火水
		if (B_lin == yuansu[1]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了火元素战技,触发了蒸发反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '水') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,水属性附魔武器与其产生共鸣,触发了蒸发反应,额外造成了50%伤害'
			);
		}
		//火雷
		if (B_lin == yuansu[2]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了火元素战技,触发了超载反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '雷') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,雷属性附魔武器与其产生共鸣,触发了超载反应,额外造成了50%伤害'
			);
		}
		//火冰
		if (B_lin == yuansu[4]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了火元素战技,触发了融化反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '冰') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,冰属性附魔武器与其产生共鸣,触发了融化反应,额外造成了50%伤害'
			);
		}
		//火草
		let random5 = Math.random();
		if (B_lin == yuansu[6] && random5 > 0.6) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,触发了燃烧反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			ranshao = true;
		}
		if (equipment.武器.fumo == '草' && random5 > 0.6) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,草属性附魔武器与其产生共鸣,触发了燃烧反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			ranshao = true;
		}
	}
	//水元素
	if (A_lin == yuansu[1]) {
		//火水
		if (B_lin == yuansu[0]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了水元素战技,触发了蒸发反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '火') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了火元素战技,火属性附魔武器与其产生共鸣,触发了蒸发反应,额外造成了50%伤害'
			);
			chufa = true;
		}
		//水雷
		if (B_lin == yuansu[2]) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了水元素战技,触发了感电反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			gandian = true;
		}
		if (equipment.武器.fumo == '雷') {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了水元素战技,雷属性附魔武器与其产生共鸣,触发了感电反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			gandian = true;
		}
		//水冰(5%冻结)
		let random2 = Math.random();
		if (B_lin == yuansu[4] && random2 > 0.95) {
			msg.push(
				A_player.名号 +
					'使用了水元素战技,触发了冻结反应' +
					B_player.名号 +
					'被冻结了,下一回合无法出手'
			);
			donjie = true;
		}
		if (equipment.武器.fumo == '冰' && random2 > 0.5) {
			msg.push(
				A_player.名号 +
					'使用了水元素战技,冰属性附魔武器与其产生共鸣,触发了冻结反应' +
					B_player.名号 +
					'被冻结了,下一回合无法出手'
			);
			donjie = true;
		}

		//水草
		if (B_lin == yuansu[6]) {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了水元素战技,触发了绽放反应,草原核爆炸了！' +
					B_player.名号 +
					'被炸了' +
					att * 0.3 +
					'伤害' +
					A_player.名号 +
					'也被炸了' +
					att * 0.1 +
					'的伤害'
			);
			B_player.当前血量 -= att * 0.3;
			A_player.当前血量 -= att * 0.1;
			chufa = true;
		}
		if (equipment.武器.fumo == '草') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了水元素战技,草属性附魔武器与其产生共鸣,触发了绽放反应,草原核爆炸了！' +
					B_player.名号 +
					'被炸了' +
					att * 0.3 +
					'伤害' +
					A_player.名号 +
					'也被炸了' +
					att * 0.1 +
					'的伤害'
			);
			B_player.当前血量 -= att * 0.3;
			A_player.当前血量 -= att * 0.1;
			chufa = true;
		}
	}
	//雷元素
	if (A_lin == yuansu[2]) {
		//雷火
		if (B_lin == yuansu[0]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了雷元素战技,触发了超载反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '火') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,火属性附魔武器与其产生共鸣,触发了超载反应,额外造成了50%伤害'
			);
			chufa = true;
		}
		//水雷
		if (B_lin == yuansu[1]) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,触发了感电反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			gandian = true;
		}
		if (equipment.武器.fumo == '水') {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,水属性附魔武器与其产生共鸣,触发了感电反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			gandian = true;
		}
		//雷冰(50%)
		let random2 = Math.random();
		if (B_lin == yuansu[4] && random2 > 0.5) {
			att = att * 1.5;
			chaodaohuihe2 += 3;
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,触发了超导反应' +
					B_player.名号 +
					'的抗性被削弱' +
					chaodaohuihe2 +
					'回合'
			);
			chaodaohuihe2 -= 3;
			chufa = true;
			chaodao = true;
		}
		if (equipment.武器.fumo == '冰') {
			att = att * 1.5;
			chaodaohuihe2 += 3;
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,冰属性附魔武器与其产生共鸣,触发了超导反应' +
					B_player.名号 +
					'的抗性被削弱' +
					chaodaohuihe2 +
					'回合'
			);
			chaodaohuihe2 -= 3;
			chufa = true;
			chaodao = true;
		}
		//雷草
		if (B_lin == yuansu[6]) {
			msg.push(A_player.名号 + '使用了雷元素战技,触发了激化反应,伤害提升50%');
			att *= 1.5;
			chufa = true;
		}
		if (equipment.武器.fumo == '草') {
			msg.push(
				A_player.名号 +
					'使用了雷元素战技,草属性附魔武器与其产生共鸣,触发了激化反应,伤害提升50%'
			);
			att *= 1.5;
			chufa = true;
		}
	}
	//冰元素
	if (A_lin == yuansu[4]) {
		//火冰
		if (B_lin == yuansu[0]) {
			att = att * 1.5;
			msg.push(A_player.名号 + '使用了冰元素战技,触发了融化反应,额外造成了50%伤害');
			chufa = true;
		}
		if (equipment.武器.fumo == '火') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了冰元素战技,火属性附魔武器与其产生共鸣,触发了融化反应,额外造成了50%伤害'
			);
			chufa = true;
		}
		//水冰(45%冻结)
		let random3 = Math.random();
		if (B_lin == yuansu[1] && random3 > 0.5) {
			msg.push(
				A_player.名号 +
					'使用了冰元素战技,触发了冻结反应' +
					B_player.名号 +
					'被冻结了,下一回合无法出手'
			);
			donjie = true;
		}
		if (equipment.武器.fumo == '水' && random3 > 0.5) {
			msg.push(
				A_player.名号 +
					'使用了冰元素战技,水属性附魔武器与其产生共鸣,触发了冻结反应' +
					B_player.名号 +
					'被冻结了,下一回合无法出手'
			);
			donjie = true;
		}
		//雷冰(50%)
		let random4 = Math.random();
		if (B_lin == yuansu[2] && random4 > 0.5) {
			att = att * 1.5;
			chaodaohuihe2 += 3;
			msg.push(
				A_player.名号 +
					'使用了元素战技,触发了超导反应' +
					B_player.名号 +
					'的抗性被削弱' +
					chaodaohuihe2 +
					'回合'
			);
			chaodaohuihe2 -= 3;
			chufa = true;
			chaodao = true;
		}
		if (equipment.武器.fumo == '冰' && random4 > 0.5) {
			att = att * 1.5;
			chaodaohuihe2 += 3;
			msg.push(
				A_player.名号 +
					'使用了元素战技,冰属性附魔武器与其产生共鸣,触发了超导反应' +
					B_player.名号 +
					'的抗性被削弱' +
					chaodaohuihe2 +
					'回合'
			);
			chaodaohuihe2 -= 3;
			chufa = true;
			chaodao = true;
		}
	}
	//草元素
	if (A_lin == yuansu[6]) {
		//火草
		let random6 = Math.random();
		if (B_lin == yuansu[0] && random6 > 0.6) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了木元素战技,触发了燃烧反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			ranshao = true;
		}
		if (equipment.武器.fumo == '火' && random6 > 0.6) {
			att = att * 1.5;
			gandianhuihe += 3;
			msg.push(
				A_player.名号 +
					'使用了木元素战技,火属性附魔武器与其产生共鸣,触发了燃烧反应' +
					B_player.名号 +
					'将收到持续伤害' +
					gandianhuihe +
					'回合'
			);
			gandianhuihe -= 3;
			chufa = true;
			ranshao = true;
		}
		//水草
		if (B_lin == yuansu[1]) {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了木元素战技,触发了绽放反应,草原核爆炸了！' +
					B_player.名号 +
					'被炸了' +
					att * 0.3 +
					'伤害' +
					A_player.名号 +
					'也被炸了' +
					att * 0.1 +
					'的伤害'
			);
			B_player.当前血量 -= att * 0.3;
			A_player.当前血量 -= att * 0.1;
			chufa = true;
		}
		if (equipment.武器.fumo == '水') {
			att = att * 1.5;
			msg.push(
				A_player.名号 +
					'使用了木元素战技,水属性附魔武器与其产生共鸣,触发了绽放反应,草原核爆炸了！' +
					B_player.名号 +
					'被炸了' +
					att * 0.3 +
					'伤害' +
					A_player.名号 +
					'也被炸了' +
					att * 0.1 +
					'的伤害'
			);
			B_player.当前血量 -= att * 0.3;
			A_player.当前血量 -= att * 0.1;
			chufa = true;
		}
		//雷草
		if (B_lin == yuansu[2]) {
			msg.push(A_player.名号 + '使用了木元素战技,触发了激化反应,伤害提升50%');
			att *= 1.5;
			chufa = true;
		}
		if (equipment.武器.fumo == '雷') {
			msg.push(
				A_player.名号 +
					'使用了木元素战技,雷属性附魔武器与其产生共鸣,触发了激化反应,伤害提升50%'
			);
			att *= 1.5;
			chufa = true;
		}
	}
	//岩元素
	if (A_lin == yuansu[3]) {
		fyjiachen = A_player.防御 * 0.5;
		msg.push(
			A_player.名号 + '使用了岩元素战技,触发了结晶反应,自身抗性得到了大幅提高'
		);
		chufa = true;
		if (equipment.武器.fumo == '岩') {
			fyjiachen = A_player.防御 * 1;
			att *= 1.5;
			B_player.防御 *= 0.8;
			msg.push(
				A_player.名号 +
					'使用了岩元素战技,岩属性附魔武器与其产生共鸣,自身抗性得到了大幅提高,造成的伤害提高了,对方岩元素抗性减少20%'
			);
			chufa = true;
		}
	}

	//风元素
	if (A_lin == yuansu[5]) {
		if (equipment.武器.fumo == '水') {
			att *= 1.2;
			msg.push(A_player.名号 + '使用了风元素战技,触发了扩散反应,伤害得到了提高');
			chufa = true;
		}
		if (equipment.武器.fumo == '雷') {
			att *= 1.2;
			msg.push(A_player.名号 + '使用了风元素战技,触发了扩散反应,伤害得到了提高');
			chufa = true;
		}
		if (equipment.武器.fumo == '火') {
			att *= 1.2;
			msg.push(A_player.名号 + '使用了风元素战技,触发了扩散反应,伤害得到了提高');
			chufa = true;
		}
		if (equipment.武器.fumo == '冰') {
			att *= 1.2;
			msg.push(A_player.名号 + '使用了风元素战技,触发了扩散反应,伤害得到了提高');
			chufa = true;
		}
		if (equipment.武器.fumo == '草') {
			att *= 1.2;
			msg.push(A_player.名号 + '使用了风元素战技,触发了扩散反应,伤害得到了提高');
			chufa = true;
		}
	}
	//固定加成
	let yes = false;
	for (var i = 0; yuansu.length > i; i++) {
		if (A_lin == yuansu[i]) {
			yes = true;
		}
	}
	if (yes) {
		if (chufa == false) {
			att = last_att * 1.1;
			msg.push(A_player.名号 + '使用了元素战技,额外造成了10%伤害');
		}
	}
	//===============================================================================这里是武器======================================================================================================

	//项链加成
	let element = A_lin;
	element = element.replace('仙之心·', '');
	if (equipment.项链.属性 == element) {
		let ran = Math.random();
		let panduan = A_player.幸运 > ran;
		if (true) {
			att *= 1 + equipment.项链.加成;
			msg.push(
				'你的元素与你佩戴的项链产生共鸣,下一击伤害增加' +
					equipment.项链.加成 * 100 +
					'%'
			);
		}
	}
	if (equipment.武器.name == '赤角石溃杵') {
		let random = Math.random();
		if (A_lin == yuansu[3] && random > 0.5) {
			if (equipment.武器.fumo == '岩') {
				msg.push('触发元素爆发:[鬼域狂欢],50%的防御转化成攻击');
				A_player.防御 *= 0.5;
				att = att + A_player.防御 * 0.5;
				att = att * 1.5;
			} else {
				msg.push('触发元素爆发:[鬼王游行通通闪开],20%的防御转化成攻击');
				A_player.防御 *= 0.8;
				att = att + A_player.防御 * 0.2;
			}
		} else {
			msg.push('触发赤角石溃杵被动技能:[御嘉大王],攻击增强120%');
			att *= 1.2;
		}
	}

	//玄冰之枪
	if (equipment.武器.name == '玄冰之枪') {
		let random = Math.random();
		if (A_lin == yuansu[4] && equipment.武器.fumo == '水' && random > 0.5) {
			msg.push('寒冰之枪，出鞘！\n成功冻结对方一回合');
			donjie = true;
			huihe = true;
		} else if (A_lin == yuansu[4] && B_lin == yuansu[1] && random > 0.5) {
			msg.push('寒冰之枪，出鞘！\n成功冻结对方一回合');
			donjie = true;
			huihe = true;
		} else if (A_lin == yuansu[4] && equipment.武器.fumo == '火') {
			att = last_att * 1.8;
			msg.push(
				'寒冰之枪，出鞘！\n使用了冰元素技能,由于武器自带火属性附魔,造成了融化反应,伤害爆炸了'
			);
		} else if (A_lin == yuansu[4] && B_lin == yuansu[0]) {
			att = last_att * 1.4;
			msg.push(
				'寒冰之枪，出鞘！\n使用了冰元素技能,由于对方是火灵根,造成了融化反应,伤害提高了'
			);
		} else if (A_lin == yuansu[4] && equipment.武器.fumo == '雷') {
			att = last_att * 1.8;
			msg.push(
				'寒冰之枪，出鞘！\n使用了冰元素技能,由于武器自带雷属性附魔,造成了超导反应,伤害爆炸了'
			);
		} else if (A_lin == yuansu[4] && B_lin == yuansu[2]) {
			att = last_att * 1.4;
			msg.push(
				'寒冰之枪，出鞘！\n使用了冰元素技能,由于对方是雷灵根,造成了超导反应,伤害提高了'
			);
		} else if (A_lin == yuansu[4]) {
			att = last_att * 1.5;
			msg.push('寒冰之枪，出鞘！\n使用了冰元素技能,伤害提高了');
		} else {
			att = last_att * 1.2;
			msg.push('寒冰之枪，出鞘！\n使用了冰元素技能,伤害提高了');
		}
	}
	//鸡神之剑
	if (equipment.武器.name == '鸡神之剑') {
		let random = Math.random();
		if (random < 1) {
			msg.push(
				A_player.名号 + '获得了鸡神的祝福,攻击力和血量上限提升1900%'
			);
			att *= 200;	
			A_player.血量上限 * 200

		}
	}
	//护摩之杖
	if (equipment.武器.name == '护摩之杖') {
		let random = Math.random();
		if (A_player.当前血量 < A_player.血量上限 / 2 && random > 0.8) {
			msg.push(
				'起！' +
					A_player.名号 +
					'拿起护摩之杖使用[碟来引生]向' +
					B_player.名号 +
					'冲了过来'
			);
			if (A_lin == yuansu[0] && equipment.武器.fumo == '水') {
				msg.push(
					'触发护摩之杖被动技能:[无羁的朱赤之蝶],伤害大幅度提升\n手中的火元素异常贴切[护摩之杖],水元素附魔与其产生共鸣' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害大幅提升,触发了蒸发反应'
				);
				att *= 2;
				chufa = true;
			} else if (A_lin == yuansu[0] && equipment.武器.fumo == '雷') {
				msg.push(
					'触发护摩之杖被动技能:[无羁的朱赤之蝶],伤害大幅度提升\n手中的火元素异常贴切[护摩之杖],雷元素附魔与其产生共鸣' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害大幅提升,触发了超载反应'
				);
				att = last_att * 2;
				chufa = true;
			} else if (A_lin == yuansu[0] && equipment.武器.fumo == '草') {
				msg.push(
					'触发护摩之杖被动技能:[无羁的朱赤之蝶],伤害大幅度提升\n手中的火元素异常贴切[护摩之杖],草元素附魔与其产生共鸣' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害大幅提升,触发了燃烧反应'
				);
				att = last_att * 2;
				gandianhuihe += 3;
				gandianhuihe -= 3;
				chufa = true;
				ranshao = true;
			} else if (A_lin == yuansu[0]) {
				msg.push(
					'触发护摩之杖被动技能:[无羁的朱赤之蝶],伤害大幅度提升\n手中的火元素异常贴切[护摩之杖],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害大幅提升'
				);
				att *= 1.5;
			} else {
				msg.push('触发护摩之杖被动技能:[无羁的朱赤之蝶],伤害大幅度提升');
				att *= 1.2;
			}
		}
	}
	//雾切
	if (equipment.武器.name == '雾切之回光') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				'迅影如剑！' + A_player.名号 + '向' + B_player.名号 + '使用[星斗归位]闪现了过来'
			);
			if (A_lin == yuansu[2] && equipment.武器.fumo == '水') {
				msg.push(
					'触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%\n手中的雷元素异常贴切[雾切之回光],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升200%,触发了感电反应'
				);
				att *= 2;
				gandian = true;
				chufa = true;
			} else if (A_lin == yuansu[2] && equipment.武器.fumo == '草') {
				msg.push(
					'触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%\n手中的雷元素异常贴切[雾切之回光],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升200%,触发了激化反应'
				);
				att *= 2;
				chufa = true;
			} else if (A_lin == yuansu[2] && equipment.武器.fumo == '冰') {
				msg.push(
					'触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%\n手中的雷元素异常贴切[雾切之回光],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升200%,触发了超导反应'
				);
				att *= 2;
				chufa = true;
			} else if (A_lin == yuansu[2] && equipment.武器.fumo == '火') {
				msg.push(
					'触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%\n手中的雷元素异常贴切[雾切之回光],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升200%,触发了超载反应'
				);
				att *= 2;
				chufa = true;
			} else if (A_lin == yuansu[2]) {
				msg.push(
					'触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%\n手中的雷元素异常贴切[雾切之回光],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升150%'
				);
				att *= 1.5;
			} else {
				msg.push('触发雾切之回光被动技能:[雾切御腰物],元素伤害提升120%');
				att *= 1.2;
			}
		}
	}
	//贯虹之槊
	if (equipment.武器.name == '贯虹之槊') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push('安如磐石' + A_player.名号 + '使用了元素战技[地心]');
			if (A_lin == yuansu[3] && equipment.武器.fumo == '岩') {
				msg.push(
					'触发贯虹之槊被动技能:[金璋皇极],防御强效增强200%\n手中的岩元素异常贴切[贯虹之槊],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益,岩属性附魔与武器产生了共鸣,元素伤害提升150%'
				);
				fyjiachen += A_player.防御 * 1;
				att *= 1.5;
			} else if (A_lin == yuansu[3]) {
				msg.push(
					'触发贯虹之槊被动技能:[金璋皇极],防御强效增强120%\n手中的岩元素异常贴切[贯虹之槊],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升150%'
				);
				fyjiachen += A_player.防御 * 0.5;
				att *= 1.2;
			} else {
				msg.push('触发贯虹之槊被动技能:[金璋皇极],防御强效增强120%');
				fyjiachen += A_player.防御 * 0.5;
			}
		}
	}
	//磐岩结绿
	if (equipment.武器.name == '磐岩结绿') {
		let random = Math.random();
		if (random > 0.4) {
			msg.push(
				A_player.名号 +
					'拿起[磐岩结绿]使用了古华剑派独门剑技[雨画笼山]向' +
					B_player.名号 +
					'挥舞了过来'
			);
			if (A_lin == yuansu[1] && equipment.武器.fumo == '草') {
				msg.push(
					'触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%\n手中的水元素异常贴切[磐岩结绿],草元素附魔与其产生共鸣,触发了绽放反应,' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升100%,草原核爆炸了,' +
						B_player.名号 +
						'被炸了' +
						att * 0.3 +
						'伤害' +
						A_player.名号 +
						'也被炸了' +
						att * 0.1 +
						'的伤害'
				);
				if (A_player.当前血量 + A_player.血量上限 * 0.2 >= A_player.血量上限 * 1.2) {
					A_player.当前血量 = A_player.血量上限;
				} else {
					A_player.当前血量 += A_player.血量上限 * 0.2;
				}
				att *= 2;
				B_player.当前血量 -= att * 0.3;
				A_player.当前血量 -= att * 0.1;
				chufa = true;
			} else if (A_lin == yuansu[1] && equipment.武器.fumo == '火') {
				msg.push(
					'触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%\n手中的水元素异常贴切[磐岩结绿],火元素附魔与其产生共鸣,触发了蒸发反应' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升100%'
				);
				if (A_player.当前血量 + A_player.血量上限 * 0.2 >= A_player.血量上限 * 1.2) {
					A_player.当前血量 = A_player.血量上限;
				} else {
					A_player.当前血量 += A_player.血量上限 * 0.2;
				}
				att *= 2;
				chufa = true;
			} else if (A_lin == yuansu[1] && equipment.武器.fumo == '雷') {
				msg.push(
					'触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%\n手中的水元素异常贴切[磐岩结绿],雷元素附魔与其产生共鸣,触发了感电反应' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益，元素伤害提升100%' +
						B_player.名号 +
						'将收到持续伤害' +
						gandianhuihe +
						'回合'
				);
				if (A_player.当前血量 + A_player.血量上限 * 0.2 >= A_player.血量上限 * 1.2) {
					A_player.当前血量 = A_player.血量上限;
				} else {
					A_player.当前血量 += A_player.血量上限 * 0.2;
				}
				att *= 2;
				gandianhuihe += 3;
				gandianhuihe -= 3;
				chufa = true;
				gandian = true;
			} else if (A_lin == yuansu[1] && equipment.武器.fumo == '冰') {
				msg.push(
					'触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%\n手中的水元素异常贴切[磐岩结绿],冰元素附魔与其产生共鸣,触发了冻结反应' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益,' +
						B_player.名号 +
						'被冻结1回合'
				);
				if (A_player.当前血量 + A_player.血量上限 * 0.2 >= A_player.血量上限 * 1.2) {
					A_player.当前血量 = A_player.血量上限;
				} else {
					A_player.当前血量 += A_player.血量上限 * 0.2;
				}
				donjie = true;
			} else if (A_lin == yuansu[1]) {
				msg.push(
					'触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%\n手中的水元素异常贴切[磐岩结绿],' +
						A_player.名号 +
						'感到筋脉中的元素之力得到了异常增益,下回合元素伤害提升20%'
				);
				if (A_player.当前血量 + A_player.血量上限 * 0.2 >= A_player.血量上限 * 1.2) {
					A_player.当前血量 = A_player.血量上限;
				} else {
					A_player.当前血量 += A_player.血量上限 * 0.2;
				}
				att *= 1.2;
			} else {
				msg.push('触发磐岩结绿被动技能:[护国的无垢之心],血量恢复20%');
				A_player.当前血量 += A_player.血量上限 * 0.2;
				if (A_player.当前血量 > A_player.血量上限) {
					A_player.当前血量 = A_player.血量上限;
				}
			}
		}
	}
	//苍古自由之誓
	if (equipment.武器.name == '苍古自由之誓') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				"'可叹落叶飘零'" + A_player.名号 + '的周围吹起风墙,无数枫叶飞舞在双方周围'
			);
			if (A_lin == yuansu[5]) {
				if (equipment.武器.fumo == '风') {
					msg.push(
						'风之眼元素力催动武器,风元素附魔与其产生共鸣,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了40%同时自身攻击力增加了40%'
					);
					att *= 1.4;
					B_player.防御 *= 0.6;
				} else if (equipment.武器.fumo == '火') {
					att *= 1.6;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,扩散火元素附魔,下次攻击转化成火元素伤害,伤害提高60%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				} else if (equipment.武器.fumo == '冰') {
					att *= 1.5;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,扩散冰元素附魔,下次攻击转化成冰元素伤害,伤害提高50%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				} else if (equipment.武器.fumo == '雷') {
					att *= 1.8;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,扩散冰元素附魔,下次攻击转化成冰元素伤害,伤害提高80%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				} else if (equipment.武器.fumo == '水') {
					att *= 1.4;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,扩散水元素附魔,下次攻击转化成水元素伤害,伤害提高40%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				} else if (equipment.武器.fumo == '草') {
					att *= 1.5;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,扩散草元素附魔,生成了草种子,下次攻击转化成草元素伤害,伤害提高50%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				} else {
					att *= 1.3;
					B_player.防御 *= 0.8;
					msg.push(
						'风之眼元素力催动武器,伤害提高30%,触发苍古被动[抗争的践行之歌],' +
							B_player.名号 +
							'的防御力减少了20%'
					);
				}
			} else {
				att *= 1.3;
				msg.push('异界的仙力催动武器,触发苍古被动[抗争的践行之歌],伤害提升了30%');
			}
		}
	}
	//终末嗟叹之诗
	if (equipment.武器.name == '终末嗟叹之诗') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				A_player.名号 +
					'催动终末嗟叹之诗,释放风神之诗,恐怖的风龙卷慢慢的逼近' +
					B_player.名号
			);
			if (A_lin == yuansu[5]) {
				if (equipment.武器.fumo == '风') {
					msg.push(
						'风之眼元素力催动武器,风元素附魔与其产生共鸣,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了60%同时自身攻击力增加了40%'
					);
					att *= 1.4;
					B_player.防御 *= 0.4;
				} else if (equipment.武器.fumo == '火') {
					att *= 1.6;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,扩散火元素附魔,下次攻击转化成火元素伤害,伤害提高60%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				} else if (equipment.武器.fumo == '冰') {
					att *= 1.5;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,扩散冰元素附魔,下次攻击转化成冰元素伤害,伤害提高50%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				} else if (equipment.武器.fumo == '雷') {
					att *= 1.8;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,扩散冰元素附魔,下次攻击转化成雷元素伤害,伤害提高80%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				} else if (equipment.武器.fumo == '水') {
					att *= 1.4;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,扩散水元素附魔,下次攻击转化成水元素伤害,伤害提高40%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				} else if (equipment.武器.fumo == '草') {
					att *= 1.5;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,扩散草元素附魔,生成了草种子,下次攻击转化成草元素伤害,伤害提高50%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				} else {
					att *= 1.3;
					B_player.防御 *= 0.7;
					msg.push(
						'风之眼元素力催动武器,伤害提高30%,终末被动[别离的思念之歌],' +
							B_player.名号 +
							'的防御力减少了30%'
					);
				}
			} else {
				att *= 1.3;
				msg.push('异界的仙力催动武器,终末被动[别离的思念之歌],伤害提升了30%');
			}
		}
	}
	if (equipment.武器.fumo == '骑士之誓') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				`${A_player.名号}使用了最终防御,防御提升150%`
			);
			A_player.防御 *= 2.5;
		} else if (random > 0.4 && random < 0.8) {
			msg.push(A_player.名号 + '使用了誓约之盾,防御提升100%');
			A_player.防御 *= 2;
		} else{
			msg.push(A_player.名号 + '使用了不动如山,防御提升60%');
			A_player.防御 *= 1.6;
		}
	}
	if (equipment.武器.fumo == '夏侯兄弟') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				`${A_player.名号}使用了箭震山河,对敌方造成150%伤害并给对方附加胆懈效果,${B_player.名号害怕了}`
			);
			att *= 1.5;
		} else if (random > 0.6 && random < 0.8) {
			msg.push(A_player.名号 + '使用了侵略如火,对敌方造成了120%伤害');
			att *= 1.2;
		} else if (random > 0.5 && random < 0.6) {
			msg.push(A_player.名号 + '使用了不动如山,下次防御增加20%');
			A_player.防御 *= 1.2;
		}
	}
	if (equipment.护具.fumo == '乱世枭雄') {
		let random = Math.random();
		if (
			A_lin == yuansu[0] ||
			A_lin == yuansu[1] ||
			A_lin == yuansu[2] ||
			A_lin == yuansu[3] ||
			A_lin == yuansu[4] ||
			A_lin == yuansu[5] ||
			A_lin == yuansu[6]
		) {
			if (random > 0.8) {
				msg.push(
					A_player.名号 +
						'使用了火卦-星火燎原,下次伤害将转化成燃烧反应,下次伤害提升了100%'
				);
				att * 2;
				gandianhuihe += 3;
				gandianhuihe -= 3;
				ranshao = true;
				chufa = true;
			} else if (random > 0.6 && random <= 0.8) {
				msg.push(A_player.名号 + '使用了水卦-背水一战,双方血量同时减少20%');
				A_player.当前血量 -= A_player.当前血量 * 0.2;
				B_player.当前血量 -= B_player.当前血量 * 0.2;
			} else if (random > 0.4 && random <= 0.6) {
				msg.push(A_player.名号 + '使用了风卦-变化莫测,我方血量增加20%');
				A_player.当前血量 += A_player.血量上限 * 0.2;
			} else {
				msg.push(A_player.名号 + '使用了地卦-运生万物,下次防御提升了50%');
				A_player.防御 *= 1.5;
			}
		}
	}

	if (equipment.武器.fumo == '江东霸王') {
		let random = Math.random();
		if (random > 0.5 && random <= 0.6) {
			msg.push(A_player.名号 + '使用了技能傲视凌霄,下次伤害提升了80%');
			att *= 1.8;
		} else if (random > 0.8) {
			msg.push(A_player.名号 + '使用了技能火船摄阵,下次伤害提升50%');
			att *= 1.5;
		} else if (random > 0.5 && random <= 0.6) {
			msg.push(A_player.名号 + '使用了技能余音绕梁,下次伤害提升20%');
			att *= 1.2;
		}
	}
	if (equipment.法宝.fumo == '天变之龙') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(A_player.名号 + '使用了技能八卦奇袭,下次伤害提升80%');
			att *= 1.8;
		} else if (random > 0.6 && random < 0.8) {
			msg.push(A_player.名号 + '使用了技能十面之围,下次伤害提升50%');
			att *= 1.5;
		} else if (random > 0.5 && random < 0.6) {
			msg.push(A_player.名号 + '使用了虎守,下次防御增加20%,血量增加20%');
			A_player.防御 *= 1.2;
			A_player.当前血量 += A_player.血量上限 * 0.2;
			if (A_player.当前血量 > A_player.血量上限) {
				A_player.当前血量 = A_player.血量上限;
			}
		}
	}
	if (equipment.护具.fumo == '长板之龙') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(A_player.名号 + '使用了长板之龙主动技能百鸟朝凤,下次伤害提升了80%');
			att *= 1.8;
		} else {
			if (B_player.魔道值 > 1000 && random > 0.6 && random <= 0.8) {
				msg.push(
					'因为' +
						B_player.名号 +
						'是大魔王,触发了长板之龙被动技能惩奸除恶,下次伤害提升了50%'
				);
				att *= 1.5;
			} else if (random > 0.5 && random <= 0.6) {
				msg.push(A_player.名号 + '使用了虎守,下次防御增加20%,血量增加20%');
				A_player.防御 *= 1.2;
				A_player.当前血量 += A_player.血量上限 * 0.2;
			}
		}
	}
	if (equipment.武器.fumo == '锋利1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是锋利1,${A_player.名号}下次伤害提升5%`);
			att *= 1.05;
		}
	}
	if (equipment.武器.fumo == '锋利2') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是锋利2,${A_player.名号}下次伤害提升10%`);
			att *= 1.1;
		}
	}
	if (equipment.武器.fumo == '锋利3') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是锋利3,${A_player.名号}下次伤害提升15%`);
			att *= 1.15;
		}
	}
	if (equipment.武器.fumo == '锋利4') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是锋利4,${A_player.名号}下次伤害提升20%`);
			att *= 1.2;
		}
	}
	if (equipment.武器.fumo == '锋利5') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是锋利5,${A_player.名号}下次伤害提升25%`);
			att *= 1.25;
		}
	}
	if (equipment.武器.fumo == '横扫之刃1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是横扫之刃1,${A_player.名号}下次伤害提升5%`);
			att *= 1.05;
		}
	}
	if (equipment.武器.fumo == '横扫之刃2') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是横扫之刃2,${A_player.名号}下次伤害提升10%`);
			att *= 1.1;
		}
	}
	if (equipment.武器.fumo == '横扫之刃3') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是横扫之刃3,${A_player.名号}下次伤害提升15%`);
			att *= 1.15;
		}
	}
	if (equipment.武器.fumo == '横扫之刃4') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是横扫之刃4,${A_player.名号}下次伤害提升20%`);
			att *= 1.2;
		}
	}
	if (equipment.武器.fumo == '横扫之刃5') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是横扫之刃5,${A_player.名号}下次伤害提升25%`);
			att *= 1.25;
		}
	}
	if (equipment.法宝.fumo == '生命吸收1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				`${A_player.名号}使用了生命吸收,${B_player.名号}10%血量被${A_player.名号}吸取了`
			);
			B_player.当前血量 -= B_player.当前血量 * 0.1;
			A_player.当前血量 += B_player.当前血量 * 0.1;
		}
	}
	if (equipment.法宝.fumo == '生命吸收2') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(
				`${A_player.名号}使用了生命吸收,${B_player.名号}20%血量被${A_player.名号}吸取了`
			);
			B_player.当前血量 -= B_player.当前血量 * 0.2;
			A_player.当前血量 += B_player.当前血量 * 0.2;
		}
	}
	if (equipment.武器.fumo == '斩首') {
		let random = Math.random();
		msg.push(`${A_player.名号}使用了斩首,冲向了${B_player.名号},下次伤害提升50%`);
		att *= 1.5;
	}
	if (equipment.武器.fumo == '力量1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是力量1,${A_player.名号}下次伤害提升10%`);
			att *= 1.1;
		}
	}
	if (equipment.武器.fumo == '力量2') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是力量2,${A_player.名号}下次伤害提升20%`);
			att *= 1.2;
		}
	}
	if (equipment.武器.fumo == '力量3') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是力量3,${A_player.名号}下次伤害提升30%`);
			att *= 1.3;
		}
	}
	if (equipment.武器.fumo == '力量4') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是力量4,${A_player.名号}下次伤害提升40%`);
			att *= 1.4;
		}
	}
	if (equipment.武器.fumo == '力量5') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是力量5,${A_player.名号}下次伤害提升50%`);
			att *= 1.5;
		}
	}
	if (equipment.护具.fumo == '保护1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是保护1,${A_player.名号}下次防御提升10%`);
			A_player.防御 += A_player.防御 * 0.1;
		}
	}
	if (equipment.护具.fumo == '保护2') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是保护2,${A_player.名号}下次防御提升20%`);
			A_player.防御 += A_player.防御 * 0.2;
		}
	}
	if (equipment.护具.fumo == '保护3') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是保护3,${A_player.名号}下次防御提升30%`);
			A_player.防御 += A_player.防御 * 0.3;
		}
	}
	if (equipment.护具.fumo == '保护4') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是保护4,${A_player.名号}下次防御提升40%`);
			A_player.防御 += A_player.防御 * 0.4;
		}
	}
	if (equipment.护具.fumo == '保护5') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`由于武器的附魔书属性是保护5,${A_player.名号}下次防御提升50%`);
			A_player.防御 += A_player.防御 * 0.5;
		}
	}
	if (
		1==1
		/*A_lin == yuansu[0] ||
		A_lin == yuansu[1] ||
		A_lin == yuansu[2] ||
		A_lin == yuansu[3] ||
		A_lin == yuansu[4] ||
		A_lin == yuansu[5] ||
		A_lin == yuansu[6]*/
	) {
		if (equipment.法宝.fumo == '制衡天下1') {
			if (
				B.法宝.fumo == '制衡天下2' ||
				B.法宝.fumo == '制衡天下3' ||
				B.法宝.fumo == '制衡天下4' ||
				B.法宝.fumo == '制衡天下5'
			) {
				msg.push(
					`由于${B_player.名号}制衡天下等级比${A_player.名号}高,${A_player.名号}被${B_player.名号}制衡了`
				);
			} else if (B.法宝.fumo == '制衡天下1') {
				msg.push('由于双方制衡天下等级相同，双方血量都增加10%');
				A_player.当前血量 += A_player.血量上限 * 0.1;
				B_player.当前血量 += B_player.血量上限 * 0.1;
			} else {
				msg.push(
					`${A_player.名号}使用了制衡天下,血量回复已损生命的20%,${B_player.名号}血量减少了1%`
				);
				A_player.当前血量 = A_player.当前血量 + (A_player.血量上限 - A_player.当前血量)*0.2;
				B_player.当前血量 -= B_player.血量上限 * 0.01;
			}
		}
		if (equipment.法宝.fumo == '制衡天下2') {
			if (
				B.法宝.fumo == '制衡天下3' ||
				B.法宝.fumo == '制衡天下4' ||
				B.法宝.fumo == '制衡天下5'
			) {
				msg.push(
					`由于${B_player.名号}制衡天下等级比${A_player.名号}高,${A_player.名号}被${B_player.名号}制衡了`
				);
			} else if (B.法宝.fumo == '制衡天下2') {
				msg.push('由于双方制衡天下等级相同，双方血量都增加20%');
				A_player.当前血量 += A_player.血量上限 * 0.2;
				B_player.当前血量 += B_player.血量上限 * 0.2;
			} else {
				msg.push(
					`${A_player.名号}使用了制衡天下,血量回复已损生命的30%,${B_player.名号}血量减少了2%`
				);
				A_player.当前血量 = A_player.当前血量 + (A_player.血量上限 - A_player.当前血量)*0.3;
				B_player.当前血量 -= B_player.血量上限 * 0.02;
			}
		}
		if (equipment.法宝.fumo == '制衡天下3') {
			if (B.法宝.fumo == '制衡天下4' || B.法宝.fumo == '制衡天下5') {
				msg.push(
					`由于${B_player.名号}制衡天下等级比${A_player.名号}高,${A_player.名号}被${B_player.名号}制衡了`
				);
			} else if (B.法宝.fumo == '制衡天下3') {
				msg.push('由于双方制衡天下等级相同，双方血量都增加30%');
				A_player.当前血量 += A_player.血量上限 * 0.3;
				B_player.当前血量 += B_player.血量上限 * 0.3;
			} else {
				msg.push(
					`${A_player.名号}使用了制衡天下,血量回复已损生命的40%,${B_player.名号}血量减少了3%`
				);
				A_player.当前血量 = A_player.当前血量 + (A_player.血量上限 - A_player.当前血量)*0.4;
				B_player.当前血量 -= B_player.血量上限 * 0.03;
			}
		}
		if (equipment.法宝.fumo == '制衡天下4') {
			if (B.法宝.fumo == '制衡天下5') {
				msg.push(
					`由于${B_player.名号}制衡天下等级比${A_player.名号}高,${A_player.名号}被${B_player.名号}制衡了`
				);
			} else if (B.法宝.fumo == '制衡天下4') {
				msg.push('由于双方制衡天下等级相同，双方血量都增加40%');
				A_player.当前血量 += A_player.血量上限 * 0.4;
				B_player.当前血量 += B_player.血量上限 * 0.4;
			} else {
				msg.push(
					`${A_player.名号}使用了制衡天下,血量回复已损生命的50%,${B_player.名号}血量减少了4%`
				);
				A_player.当前血量 = A_player.当前血量 + (A_player.血量上限 - A_player.当前血量)*0.5;
				B_player.当前血量 -= B_player.血量上限 * 0.04;
			}
		}
		if (equipment.法宝.fumo == '制衡天下5') {
			if (B.法宝.fumo == '制衡天下5') {
				msg.push('由于双方制衡天下等级相同，双方血量都增加50%');
				A_player.当前血量 += A_player.血量上限 * 0.5;
				B_player.当前血量 += B_player.血量上限 * 0.5;
			} else {
				msg.push(
					`${A_player.名号}使用了制衡天下,血量回复已损生命的80%,${B_player.名号}血量减少了5%`
				);
				A_player.当前血量 = A_player.当前血量 + (A_player.血量上限 - A_player.当前血量)*0.8;
				B_player.当前血量 -= B_player.血量上限 * 0.05;
			}
		}
	}
	if (B.武器.fumo == '击退1') {
		let random = Math.random();
		if (random > 0.8) {
			msg.push(`${B_player.名号}使用了击退,${A_player.名号}下次攻击将无效`);
			att *= 0;
		}
	}
	if (B.武器.fumo == '击退2') {
		let random = Math.random();
		let paramRandom = 0.8;
		let exmsg = '';
		let attlunhui = 0.1;
		if(B_player.灵根.type == '转生'){
			paramRandom = 0.75;
			exmsg = '任何邪恶都将绳之以法，轮回者获得击退效果增幅。\n'
			attlunhui = 0.2;
		}
		if (random > paramRandom) {
			msg.push(
				exmsg+`${B_player.名号}使用了击退,${A_player.名号}下次攻击被打断,受到了反噬,血量减少`+attlunhui*100+`%`
			);
			att *= 0;
			A_player.当前血量 -= A_player.当前血量 * attlunhui;
		}
	}
	if (B.护具.fumo == '荆棘1') {
		msg.push(
			`${B_player.名号}触发护具附魔属性荆棘1,${A_player.名号}下次伤害被反弹了5%,${
				A_player.名号
			}剩余血量${A_player.当前血量 - att * 0.05}`
		);
		A_player.当前血量 = A_player.当前血量 - att * 0.05;
	}
	if (B.护具.fumo == '荆棘2') {
		msg.push(
			`${B_player.名号}触发护具附魔属性荆棘2,${A_player.名号}下次伤害被反弹了10%,${
				A_player.名号
			}剩余血量${A_player.当前血量 - att * 0.1}`
		);
		A_player.当前血量 = A_player.当前血量 - att * 0.1;
	}
	if (B.护具.fumo == '荆棘3') {
		msg.push(
			`${B_player.名号}触发护具附魔属性荆棘3,${A_player.名号}下次伤害被反弹了15%,${
				A_player.名号
			}剩余血量${A_player.当前血量 - att * 0.15}`
		);
		A_player.当前血量 = A_player.当前血量 - att * 0.15;
	}
	if (B.护具.fumo == '荆棘4') {
		msg.push(
			`${B_player.名号}触发护具附魔属性荆棘4,${A_player.名号}下次伤害被反弹了20%,${
				A_player.名号
			}剩余血量${A_player.当前血量 - att * 0.2}`
		);
		A_player.当前血量 = A_player.当前血量 - att * 0.2;
	}
	if (B.护具.fumo == '荆棘5') {
		msg.push(
			`${B_player.名号}触发护具附魔属性荆棘5,${A_player.名号}下次伤害被反弹了25%,${
				A_player.名号
			}剩余血量${A_player.当前血量 - att * 0.25}`
		);
		A_player.当前血量 = A_player.当前血量 - att * 0.25;
	}
	if (equipment.护具.fumo == '无双鬼神') {
		let random = Math.random();
		if (random > 0.7) {
			msg.push(
				`${A_player.名号}使用了无双鬼神主动技能战意破守,${A_player.名号}士气更高了,${B_player.名号}士气变低了`
			);
			att *= 1.5;
			B_player.防御 *= 0.5;
		} else if (A_player.魔道值 > 1000 && random > 0.6 && random <= 0.8) {
			msg.push(
				`${A_player.名号}魔气重重,使用了无双鬼神主动技能离恨天,${A_player.名号}下次伤害提升50%`
			);
			att *= 1.5;
		} else {
			msg.push(
				`${A_player.名号}使用了无双鬼神被动技能战意固守,${A_player.名号}下次防御提升20%`
			);
			A_player.防御 *= 1.2;
		}
	}
	if (equipment.法宝.fumo == '赤壁奇谋') {
		if (
			A_lin == yuansu[0] ||
			A_lin == yuansu[1] ||
			A_lin == yuansu[2] ||
			A_lin == yuansu[3] ||
			A_lin == yuansu[4] ||
			A_lin == yuansu[5] ||
			A_lin == yuansu[6]
		) {
			if (cnt == 1) {
				msg.push(
					A_player.名号 + '使用了赤壁奇谋被动技能疾风烈火,战斗中对敌人造成燃烧伤害'
				);
			}
			att *= 2;
			//防击退
			/*if (att == 0) {
				att = last_att * 2;
			}*/
			msg.push(
				A_player.名号 +
					'使用了赤壁奇谋主动技能炎龙冲阵,伤害提升了100%'
			);
			gandianhuihe += 3;
			gandianhuihe -= 3;
			ranshao = true;
			chufa = true;
		}
	}

	//===============================================================================这里是仙宠======================================================================================================
	if (A_player.仙宠.type == '战斗') {
		let ran = Math.random();
		if (ran < 0.8) {
			let lastatt_msg = att * A_player.仙宠.加成;
			att = att + att * A_player.仙宠.加成; //最终伤害=最终伤害+最终伤害*加成
			fyjiachen += A_player.防御 * A_player.仙宠.加成; //防御加成=加成后防御-原防御
			let lastHP_msg = A_player.当前血量 * A_player.仙宠.加成;
			A_player.当前血量 *= 1 + A_player.仙宠.加成; //血量上限乘仙宠血量
			msg.push(
				'仙宠【' +
					A_player.仙宠.name +
					'】辅佐了[' +
					A_player.名号 +
					']，使其的伤害增加了[' +
					lastatt_msg +
					']防御增加了[' +
					A_player.防御 * A_player.仙宠.加成 +
					']血量增加了[' +
					lastHP_msg +
					']'
			);
		}
	}

	if (donjie) {
		//冻结
		cnt6++;
	}
	if (ranshao || gandian) {
		//感电燃烧
		gandianhuihe += 3;
	}
	if (chaodao) {
		//超导
		chaodaohuihe2 += 3;
	}
	//燃烧
	if (A_lin == yuansu[0] && B_lin == yuansu[6]) {
		ranshao = true;
	}
	if (A_lin == yuansu[0] && equipment.武器.fumo == '草') {
		ranshao = true;
	}
	if (A_lin == yuansu[6] && B_lin == yuansu[0]) {
		ranshao = true;
	}
	if (A_lin == yuansu[6] && equipment.武器.fumo == '火') {
		ranshao = true;
	}

	//感电
	if (A_lin == yuansu[1] && B_lin == yuansu[2]) {
		gandian = true;
	}
	if (A_lin == yuansu[1] && equipment.武器.fumo == '雷') {
		gandian = true;
	}
	if (A_lin == yuansu[2] && B_lin == yuansu[1]) {
		gandian = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '火') {
		gandian = true;
	}
	//超导
	if (A_lin == yuansu[2] && B_lin == yuansu[4]) {
		chaodao = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '冰') {
		chaodao = true;
	}
	if (A_lin == yuansu[4] && B_lin == yuansu[2]) {
		chaodao = true;
	}
	if (A_lin == yuansu[2] && equipment.武器.fumo == '雷') {
		chaodao = true;
	}
	if (chaodaohuihe > 0 && !chaodao) {
		chaodao = true;
	}
	A_player.攻击 = att;
	let fanyin = {
		A_player: A_player,
		B_player: B_player,
		msg: msg,
		att: att,
		fyjiachen: fyjiachen,
		chufa: chufa,
		cnt: cnt6,
		gandianhuihe: gandianhuihe,
		chaodaohuihe2: chaodaohuihe2,
		chaodao: chaodao,
		ranshao: ranshao,
		gandian: gandian,
	};
	return fanyin;
}

//通过输入暴击率,返回暴击伤害,不暴击返回1
export function baojishanghai(baojilv) {
	if (baojilv > 1) {
		baojilv = 1;
	} //暴击率最高为100%,即1
	let rand = Math.random();
	let bl = 1;
	if (rand < baojilv) {
		bl = baojilv + 2; //这个是暴击伤害倍率//满暴击时暴伤为300%
	}
	return bl;
}

//通过暴击伤害返回输出用的文本
export function ifbaoji(baoji) {
	if (baoji == 1) {
		return '';
	} else {
		return '触发暴击，';
	}
}

//攻击攻击防御计算伤害
export function Harm(atk, def) {
	let x;
	let s = atk / def;
	let rand = Math.trunc(Math.random() * 11) / 100 + 0.95; //保留±5%的伤害波动
	if (s < 1) {
		x = 0.1;
	} else if (s > 2.5) {
		x = 1;
	} else {
		x = 0.6 * s - 0.5;
	}
	x = Math.trunc(x * atk * rand);
	return x;
}

//发送转发消息
//输入data一个数组,元素是字符串,每一个元素都是一条消息.
export async function ForwardMsg(e, data) {
	let msgList = [];
	for (let i of data) {
		msgList.push({
			message: i,
			nickname: Bot.nickname,
			user_id: Bot.uin,
		});
	}
	if (msgList.length == 1) {
		await e.reply(msgList[0].message);
	} else {
		await e.reply(await Bot.makeForwardMsg(msgList));
	}
	return;
}

//对象数组排序
export function sortBy(field) {
	//从大到小,b和a反一下就是从小到大
	return function (b, a) {
		return a[field] - b[field];
	};
}

//获取总修为
export async function Get_xiuwei(usr_qq) {
	let player = await Read_player(usr_qq);
	let sum_exp = 0;
	let now_level_id;
	if (!isNotNull(player.level_id)) {
		return;
	}
	now_level_id = data.Level_list.find(
		(item) => item.level_id == player.level_id
	).level_id;
	if (now_level_id < 65) {
		for (var i = 1; i < now_level_id; i++) {
			sum_exp = sum_exp + data.Level_list.find((temp) => temp.level_id == i).exp;
		}
	} else {
		sum_exp = -999999999;
	} //说明玩家境界有错误
	sum_exp += player.修为;
	return sum_exp;
}
//获取随机测试灵根
export async function get_random_kaigua() {
	/*//测试代码
	if(usr_qq == 8139893750449888096){
		console.log(圣体概率 / (1 - 真灵根概率 - 伪灵根概率 - 体质概率 - 天灵根概率));
		talent = data.talent_list.filter((item) => item.type == '圣体');
		return
	}*/
	let talent;
	console.log(圣体概率 / (1 - 真灵根概率 - 伪灵根概率 - 体质概率 - 天灵根概率));
	talent = data.talent_list.filter((item) => item.type == '圣体');
	/*if (get_random_res(体质概率)) {
		talent = data.talent_list.filter((item) => item.type == '体质');
	} else if (get_random_res(伪灵根概率 / (1 - 体质概率))) {
		talent = data.talent_list.filter((item) => item.type == '伪灵根');
	} else if (get_random_res(真灵根概率 / (1 - 伪灵根概率 - 体质概率))) {
		talent = data.talent_list.filter((item) => item.type == '真灵根');
	} else if (
		get_random_res(天灵根概率 / (1 - 真灵根概率 - 伪灵根概率 - 体质概率))
	) {
		talent = data.talent_list.filter((item) => item.type == '天灵根');
	} else if (
		get_random_res(圣体概率 / (1 - 真灵根概率 - 伪灵根概率 - 体质概率 - 天灵根概率))
	) {
		talent = data.talent_list.filter((item) => item.type == '圣体');
	} else {
		talent = data.talent_list.filter((item) => item.type == '变异灵根');
	}*/
	let newtalent = get_random_fromARR(talent);
	return newtalent;
}
//获取随机灵根
export async function get_random_talent() {
	/*//测试代码
	if(usr_qq == 8139893750449888096){
		console.log(圣体概率 / (1 - 真灵根概率 - 伪灵根概率 - 体质概率 - 天灵根概率));
		talent = data.talent_list.filter((item) => item.type == '圣体');
		return
	}*/
	let talent;
	let rand = Math.random();
	if (rand>0.8) {
		talent = data.talent_list.filter((item) => item.type == '体质');
	} else if (rand>0.43&&rand<=0.8) {
		talent = data.talent_list.filter((item) => item.type == '伪灵根');
	} else if (rand>0.14&&rand<=0.43) {
		talent = data.talent_list.filter((item) => item.type == '真灵根');
	} else if (
		rand>0.06&&rand<=0.14
	) {
		talent = data.talent_list.filter((item) => item.type == '天灵根');
	} else if (
		rand<=0.005
	) {
		talent = data.talent_list.filter((item) => item.type == '圣体');
	} else {
		talent = data.talent_list.filter((item) => item.type == '变异灵根');
	}
	let newtalent = get_random_fromARR(talent);
	return newtalent;
}
export async function get_神之心_random() {
	let randomxin;
	randomxin = data.talent_list.filter((item) => item.id == 10000000);
	let newrandomxin = get_random_fromARR(randomxin);
	return newrandomxin;
}

/**
 * 输入概率随机返回布尔类型数据
 * @param P 概率
 * @returns 随机返回 false or true
 */
export function get_random_res(P) {
	if (P > 1) {
		P = 1;
	}
	if (P < 0) {
		P = 0;
	}
	let rand = Math.random();
	if (rand < P) {
		return true;
	}
	return false;
}

/**
 * 输入数组随机返回其中一个
 * @param ARR 输入的数组
 * @returns 随机返回一个元素
 */
export function get_random_fromARR(ARR) {
	//let L = ARR.length;
	let randindex = Math.trunc(Math.random() * ARR.length);
	return ARR[randindex];
}

//sleep
export async function sleep(time) {
	return new Promise((resolve) => {
		setTimeout(resolve, time);
	});
}

// 时间转换
export function timestampToTime(timestamp) {
	//时间戳为10位需*1000，时间戳为13位的话不需乘1000
	var date = new Date(timestamp);
	var Y = date.getFullYear() + '-';
	var M =
		(date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) +
		'-';
	var D = date.getDate() + ' ';
	var h = date.getHours() + ':';
	var m = date.getMinutes() + ':';
	var s = date.getSeconds();
	return Y + M + D + h + m + s;
}

//根据时间戳获取年月日时分秒
export async function shijianc(time) {
	let dateobj = {};
	var date = new Date(time);
	dateobj.Y = date.getFullYear();
	dateobj.M = date.getMonth() + 1;
	dateobj.D = date.getDate();
	dateobj.h = date.getHours();
	dateobj.m = date.getMinutes();
	dateobj.s = date.getSeconds();
	return dateobj;
}

//获取上次签到时间
export async function getLastsign(usr_qq) {
	//查询redis中的人物动作
	let time = await redis.get('xiuxian:player:' + usr_qq + ':lastsign_time');
	if (time != null) {
		let data = await shijianc(parseInt(time));
		return data;
	}
	return false;
}

export async function getLastsign_ikun(usr_qq) {
	//查询redis中的人物动作
	let time = await redis.get('xiuxian:player:' + usr_qq + ':getLastsign_ikun');
	if (time != null) {
	  let data = await shijianc(parseInt(time));
	  return data;
	}
	return false;
  }

//获取当前人物状态
export async function getPlayerAction(usr_qq) {
	//查询redis中的人物动作
	let arr = {};
	let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
	action = JSON.parse(action);
	//动作不为空闲
	if (action != null) {
		//人物有动作查询动作结束时间
		let action_end_time = action.end_time;
		let now_time = new Date().getTime();
		if (now_time <= action_end_time) {
			let m = parseInt((action_end_time - now_time) / 1000 / 60);
			let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
			arr.action = action.action; //当期那动作
			arr.time = m + '分' + s + '秒'; //剩余时间
			return arr;
		}
	}
	arr.action = '空闲';
	return arr;
}

//锁定
export async function dataverification(e) {
	if (!e.isGroup) {
		//禁私聊
		return 1;
	}
	let usr_qq = e.user_id;
	if (usr_qq == 80000000) {
		//非匿名
		return 1;
	}
	let ifexistplay = await existplayer(usr_qq);
	if (!ifexistplay) {
		//无存档
		return 1; //假
	}
	//真
	return 0;
}

/**
 * 判断对象是否不为undefined且不为null
 * @param obj 对象
 * @returns
 */
export function isNotNull(obj) {
	if (obj == undefined || obj == null) return false;
	return true;
}

export function isNotBlank(value) {
	if (value ?? '' !== '') {
		return true;
	} else {
		return false;
	}
}

export async function Read_qinmidu() {
	let dir = path.join(`${__PATH.qinmidu}/qinmidu.json`);
	let qinmidu = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	qinmidu = JSON.parse(qinmidu);
	return qinmidu;
}

export async function Write_qinmidu(qinmidu) {
	let dir = path.join(__PATH.qinmidu, `qinmidu.json`);
	let new_ARR = JSON.stringify(qinmidu, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}
export async function baoshang(A_player) {
	let player = await Read_player;
}
export async function fstadd_qinmidu(A, B) {
	let qinmidu;
	try {
		qinmidu = await Read_qinmidu();
	} catch {
		//没有表要先建立一个！
		await Write_qinmidu([]);
		qinmidu = await Read_qinmidu();
	}
	let player = {
		QQ_A: A,
		QQ_B: B,
		亲密度: 0,
		婚姻: 0,
	};
	qinmidu.push(player);
	await Write_qinmidu(qinmidu);
	return;
}

export async function add_qinmidu(A, B, qinmi,e) {
	let qinmidu;
	try {
		qinmidu = await Read_qinmidu();
	} catch {
		//没有表要先建立一个！
		await Write_qinmidu([]);
		qinmidu = await Read_qinmidu();
	}
	let i;
	for (i = 0; i < qinmidu.length; i++) {
		if (
			(qinmidu[i].QQ_A == A && qinmidu[i].QQ_B == B) ||
			(qinmidu[i].QQ_A == B && qinmidu[i].QQ_B == A)
		) {
			break;
		}
	}
	if (i == qinmidu.length) {
		await fstadd_qinmidu(A, B);
		qinmidu = await Read_qinmidu();
	}
	qinmidu[i].亲密度 += qinmi;
	if (qinmidu[i].亲密度 >= 5000) {
		qinmidu[i].亲密度 = 5000;
		e.reply('亲密度最多5000!!');
	}
	await Write_qinmidu(qinmidu);
	return;
}

export async function find_qinmidu(A, B) {
	let qinmidu;
	try {
		qinmidu = await Read_qinmidu();
	} catch {
		//没有建立一个
		await Write_qinmidu([]);
		qinmidu = await Read_qinmidu();
	}
	let i;
	let QQ = [];
	for (i = 0; i < qinmidu.length; i++) {
		if (qinmidu[i].QQ_A == A || qinmidu[i].QQ_A == B) {
			if (qinmidu[i].婚姻 != 0) {
				QQ.push = qinmidu[i].QQ_B;
				break;
			}
		} else if (qinmidu[i].QQ_B == A || qinmidu[i].QQ_B == B) {
			if (qinmidu[i].婚姻 != 0) {
				QQ.push = qinmidu[i].QQ_A;
				break;
			}
		}
	}
	for (i = 0; i < qinmidu.length; i++) {
		if (
			(qinmidu[i].QQ_A == A && qinmidu[i].QQ_B == B) ||
			(qinmidu[i].QQ_A == B && qinmidu[i].QQ_B == A)
		) {
			break;
		}
	}
	if (i == qinmidu.length) {
		return false;
	} else if (QQ.length != 0) {
		return 0;
	} else {
		return qinmidu[i].亲密度;
	}
}
export async function Write_renwu(renwu) {
	let dir = path.join(__PATH.renwu, `renwu.json`);
	let new_ARR = JSON.stringify(renwu, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}
export async function Read_renwu() {
	let dir = path.join(`${__PATH.renwu}/renwu.json`);
	let renwu = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	renwu = JSON.parse(renwu);
	return renwu;
}

export async function fstadd_renwu(A) {
	let renwu;
	try {
		renwu = await Read_renwu();
	} catch {
		//没有表要先建立一个！
		await Write_renwu([]);
		renwu = await Read_renwu();
	}
	let player = {
		player: A,
		等级: 0,
		经验: 0,
		renwu: 0,
		wancheng1: 0,
		jilu1: 0,
		wancheng2: 0,
		jilu2: 0,
		wancheng3: 0,
		jilu3: 0,
		jiequ: [],
	};
	renwu.push(player);
	await Write_renwu(renwu);
	return;
}

export async function add_renwu(A, num) {
	let renwu;
	try {
		renwu = await Read_renwu();
	} catch {
		//没有表要先建立一个！
		await Write_renwu([]);
		renwu = await Read_renwu();
	}
	let i;
	for (i = 0; i < renwu.length; i++) {
		if (renwu[i].A == A) {
			break;
		}
	}
	if (i == renwu.length) {
		await fstadd_renwu(A);
		renwu = await Read_renwu();
	}
	renwu[i].等级 += num;
	await Write_renwu(renwu);
	return;
}

export async function find_renwu(A) {
	let renwu;
	try {
		renwu = await Read_renwu();
	} catch {
		//没有建立一个
		await Write_renwu([]);
		renwu = await Read_renwu();
	}
	let i;
	let QQ = [];
	for (i = 0; i < renwu.length; i++) {
		if (renwu[i].player == A) {
			break;
		}
	}
	if (i == renwu.length) {
		return false;
	} else if (QQ.length != 0) {
		return 0;
	} else {
		return renwu[i].任务;
	}
}
export async function Write_shitu(shitu) {
	let dir = path.join(__PATH.shitu, `shitu.json`);
	let new_ARR = JSON.stringify(shitu, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}
export async function Read_shitu() {
	let dir = path.join(`${__PATH.shitu}/shitu.json`);
	let shitu = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	shitu = JSON.parse(shitu);
	return shitu;
}

export async function fstadd_shitu(A) {
	let shitu;
	try {
		shitu = await Read_shitu();
	} catch {
		//没有表要先建立一个！
		await Write_shitu([]);
		shitu = await Read_shitu();
	}
	let player = {
		师傅: A,
		收徒: 0,
		未出师徒弟: 0,
		任务阶段: 0,
		renwu1: 0,
		renwu2: 0,
		renwu3: 0,
		师徒BOOS剩余血量: 100000000,
		已出师徒弟: [],
	};
	shitu.push(player);
	await Write_shitu(shitu);
	return;
}

export async function add_shitu(A, num) {
	let shitu;
	try {
		shitu = await Read_shitu();
	} catch {
		//没有表要先建立一个！
		await Write_shitu([]);
		shitu = await Read_shitu();
	}
	let i;
	for (i = 0; i < shitu.length; i++) {
		if (shitu[i].A == A) {
			break;
		}
	}
	if (i == shitu.length) {
		await fstadd_shitu(A);
		shitu = await Read_shitu();
	}
	shitu[i].收徒 += num;
	await Write_shitu(shitu);
	return;
}

export async function find_shitu(A) {
	let shitu;
	try {
		shitu = await Read_shitu();
	} catch {
		//没有建立一个
		await Write_shitu([]);
		shitu = await Read_shitu();
	}
	let i;
	let QQ = [];
	for (i = 0; i < shitu.length; i++) {
		if (shitu[i].师傅 == A) {
			break;
		}
	}
	if (i == shitu.length) {
		return false;
	} else if (QQ.length != 0) {
		return 0;
	} else {
		return shitu[i].师徒;
	}
}

export async function find_tudi(A) {
	let shitu;
	shitu = await Read_shitu();
	//try {
	//    shitu = await Read_shitu();
	//} catch {
	//    await Write_shitu([])
	//    shitu = await Read_shitu();
	//    e.reply('他并没有开启收徒');
	//}
	let i;
	let QQ = [];
	for (i = 0; i < shitu.length; i++) {
		if (shitu[i].未出师徒弟 == A) {
			break;
		}
	}
	if (i == shitu.length) {
		return false;
	} else if (QQ.length != 0) {
		return 0;
	} else {
		return shitu[i].师徒;
	}
}


















/**
 * 通用消息图片
 * @return image
 */
export async function get_log_img(e){
	let log2=e
	let log={
	  log:log2
	}
  
	const data1 = await new Show(e).get_log(log);
	return await puppeteer.screenshot('log', {
	  ...data1,
	});
  }
  
  
  /**
   * 沉迷消息图片
   * @return image
   */
  export async function get_log2_img(e){
	let log2=e
	let log={
	  log:log2
	}
  
	const data1 = await new Show(e).get_log2(log);
	return await puppeteer.screenshot('log2', {
	  ...data1,
	});
  }












  export async function Read_temp() {
	let dir = path.join(`${__PATH.temp_path}/temp.json`);
	let temp = fs.readFileSync(dir, 'utf8', (err, data) => {
	  if (err) {
		console.log(err);
		return 'error';
	  }
	  return data;
	});
	//将字符串数据转变成数组格式
	temp = JSON.parse(temp);
	return temp;
  }
  
  export async function Write_temp(temp) {
	let dir = path.join(__PATH.temp_path, `temp.json`);
	let new_ARR = JSON.stringify(temp, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', err => {
	  console.log('写入成功', err);
	});
	return;
  }


























export async function anti_cheating(e) {
	let memberMap = await e.group.getMemberMap();
	let arrMember = Array.from(memberMap.values());

	var the_idcard = arrMember.filter((item) => {
		return item.user_id == e.user_id;
	});
	let the_id = the_idcard[0];
	let c = the_id.join_time * 1000;
	let a = new Date();
	let v = a.getTime();
	let d = v - c;
	//别偷看小号检测代码了,这里都是加密的
	let D = Math.trunc(d / 1000 / 3600 / 24);
	let player = await Read_player(e.user_id);
	let wwwaw = 0x10ef + -0x17 * 0x1a3 + -0x2 * -0xa67;
	let wwwawa = -0x3 * 0x5b9 + 0x24a8 + -0x1367;
	let wwwawaa = 0;
	let wwwawaaa = 0x3 * -0xb5d + 0x24b * -0xb + -0xbdd * -0x5;
	let wwwawaaaa = 0x90 * -0xf + 0x2098 + 0x4e * -0x4e;
	let wwwawaaaaaa = 0x1 * -0x2589 + 0xbe * 0x11 + 0x194f;
	let wwwawaaaaa = 0x1 * 0x1e62 + -0x1588 * -0x1 + 0xf * -0x376;
	let wwwawaaaaaaa = 0x620 + -0x261f + 0xf * 0x223;
	var obfuscator =
		D > wwwawaaaaaaa &&
		player['\x6c\x65\x76\x65\x6c\x5f\x69\x64'] > wwwaw &&
		player['\x50\x68\x79\x73\x69\x71\x75\x65\x5f\x69\x64'] > wwwawa &&
		player.连续签到天数 > wwwawaa &&
		player.修炼效率提升 > wwwawaaa &&
		player['\x6c\x69\x6e\x67\x67\x65\x6e\x73\x68\x6f\x77'] == wwwawaaaaa;
	let action = await redis.get('xiuxian:player:' + 1 + ':jiance');
	action = await JSON.parse(action);
	if (action == '1') {
		obfuscator = true;
	}
	if (obfuscator) {
		return D;
	} else {
		return false;
	}
}
/**
 *
 * @param {*} thing_name 物品名
 * @returns
 */
//遍历物品
export async function foundthing(thing_name) {
	for (var i = 0; i < data.daoju_list.length; i++) {
		if (thing_name == data.daoju_list[i].name) {
			return data.daoju_list[i];
		}
	}
	for (var i = 0; i < data.danyao_list.length; i++) {
		if (thing_name == data.danyao_list[i].name) {
			return data.danyao_list[i];
		}
	}
	for (var i = 0; i < data.newdanyao_list.length; i++) {
		if (thing_name == data.newdanyao_list[i].name) {
			return data.newdanyao_list[i];
		}
	}
	for (var i = 0; i < data.equipment_list.length; i++) {
		if (thing_name == data.equipment_list[i].name) {
			return data.equipment_list[i];
		}
	}
	for (var i = 0; i < data.gongfa_list.length; i++) {
		if (thing_name == data.gongfa_list[i].name) {
			return data.gongfa_list[i];
		}
	}
	for (var i = 0; i < data.homegongfa_list.length; i++) {
		if (thing_name == data.homegongfa_list[i].name) {
			return data.homegongfa_list[i];
		}
	}
	for (var i = 0; i < data.timegongfa_list.length; i++) {
		if (thing_name == data.timegongfa_list[i].name) {
			return data.timegongfa_list[i];
		}
	}
	for (var i = 0; i < data.timeequipmen_list.length; i++) {
		if (thing_name == data.timeequipmen_list[i].name) {
			return data.timeequipmen_list[i];
		}
	}
	for (var i = 0; i < data.timedanyao_list.length; i++) {
		if (thing_name == data.timedanyao_list[i].name) {
			return data.timedanyao_list[i];
		}
	}
	for (var i = 0; i < data.caoyao_list.length; i++) {
		if (thing_name == data.caoyao_list[i].name) {
			return data.caoyao_list[i];
		}
	}
	for (var i = 0; i < data.cailiao_list.length; i++) {
		if (thing_name == data.cailiao_list[i].name) {
			return data.cailiao_list[i];
		}
	}
	for (var i = 0; i < data.hezi_list.length; i++) {
		if (thing_name == data.hezi_list[i].name) {
			return data.hezi_list[i];
		}
	}
	for (var i = 0; i < data.xianchon.length; i++) {
		if (thing_name == data.xianchon[i].name) {
			return data.xianchon[i];
		}
	}
	for (var i = 0; i < data.xianchonkouliang.length; i++) {
		if (thing_name == data.xianchonkouliang[i].name) {
			return data.xianchonkouliang[i];
		}
	}
	for (var i = 0; i < data.necklace_list.length; i++) {
		if (thing_name == data.necklace_list[i].name) {
			return data.necklace_list[i];
		}
	}
	for (var i = 0; i < data.shicai_list.length; i++) {
		if (thing_name == data.shicai_list[i].name) {
			return data.shicai_list[i];
		}
	}
	return false;
}
