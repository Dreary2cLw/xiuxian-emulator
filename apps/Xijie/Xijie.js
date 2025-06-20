import plugin from '../../../../lib/plugins/plugin.js';
import fs from 'fs';
import { __PATH } from '../Xiuxian/xiuxian.js';
import path from 'path';
import Show from '../../model/show.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import {
	existplayer,
	Read_player,
	Add_灵石,
	Write_player,
} from '../Xiuxian/xiuxian.js';

export class Xijie extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'Xijie',
			/** 功能描述 */
			dsc: '交易模块',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 600,
			rule: [
				{
					reg: '^#洗劫.*$',
					fnc: 'xijie',
				},
				{
					reg: '^#探查.*$',
					fnc: 'tancha',
				},
			],
		});
	}

	async xijie(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//查看存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}

		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		if (action != null) {
			//人物有动作查询动作结束时间
			let action_end_time = action.end_time;
			let now_time = new Date().getTime();
			if (now_time <= action_end_time) {
				let m = parseInt((action_end_time - now_time) / 1000 / 60);
				let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
				e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
				return;
			}
		}
		let nowTime = new Date().getTime();
		let lastxijie_time = await redis.get(
			'xiuxian:player:' + usr_qq + ':lastxijie_time'
		);
		lastxijie_time = parseInt(lastxijie_time);
		if (nowTime < lastxijie_time + 51200000) {
			let lastxijie_m = Math.trunc((lastxijie_time + 51200000 - nowTime) / 60 / 1000);
			let lastxijie_s = Math.trunc(
				((lastxijie_time + 51200000 - nowTime) % 60000) / 1000
			);
			e.reply(
				`每12小时洗劫一次，正在CD中，` + `剩余cd: ${lastxijie_m}分${lastxijie_s}秒`
			);
			return;
		}
		let didian = e.msg.replace('#洗劫', '');
		didian = didian.trim();
		let shop = await Read_shop();
		let i;
		for (i = 0; i < shop.length; i++) {
			if (shop[i].name == didian) {
				break;
			}
		}
		if (i == shop.length) {
			return;
		}
		if (shop[i].state == 1) {
			e.reply(didian + '已经戒备森严了,还是不要硬闯好了');
			return;
		}
		let msg = '';
		let player = await Read_player(usr_qq);
		let Price = shop[i].price * shop[i].Grade;
		if (player.leve_id < 37) {
			e.reply('在大乘巅峰前还是不要去了');
			return;
		}
		if (player.灵石 < Price) {
			e.reply('灵石不足,无法进行强化');
			return;
		} else {
			player.灵石 -= Price;
			msg += '你消费了' + Price + '灵石,自己的属性得到了强化';
		}

		//开始准备洗劫
		player.魔道值 -= (100 * shop[i].Grade);
		await Write_player(usr_qq, player);

		shop[i].state = 1;
		await Write_shop(shop);
		if (player.灵根 == null || player.灵根 == undefined) {
			player.灵根 = await get_random_talent();
			player.修炼效率提升 += player.灵根.eff;
		}
		//锁定属性
		let buff = shop[i].Grade * 0.06 + 1;
		let A_player = {
			名号: player.名号,
			攻击: parseInt(player.攻击 * buff),
			防御: parseInt(player.防御 * buff),
			当前血量: parseInt(player.血量上限 * buff),
			暴击率: player.暴击率,
			灵根: player.灵根,
			法球倍率: player.灵根.法球倍率,
			魔值: 0,
		};
		if (player.魔道值 > 999) {
			A_player.魔值 = 1;
		}
		let time = 15; //时间（分钟）
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '洗劫', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关
			working: '1', //降妖
			Place_action: '1', //秘境状态---关闭
			mojie: '1', //魔界状态---关闭
			Place_actionplus: '1', //沉迷秘境状态---关闭
			power_up: '1', //渡劫状态--关闭
			xijie: '0', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
			//这里要保存秘境特别需要留存的信息
			Place_address: shop[i],
			A_player: A_player,
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		await redis.set('xiuxian:player:' + usr_qq + ':lastxijie_time', nowTime);
		msg += '\n开始前往' + didian + ',祝你好运!';
		e.reply(msg, true);
		return;
	}

	async tancha(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//查看存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		if (action != null) {
			//人物有动作查询动作结束时间
			let action_end_time = action.end_time;
			let now_time = new Date().getTime();
			if (now_time <= action_end_time) {
				let m = parseInt((action_end_time - now_time) / 1000 / 60);
				let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
				e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
				return;
			}
		}
		let didian = e.msg.replace('#探查', '');
		didian = didian.trim();
		let shop = await Read_shop();
		let i;
		for (i = 0; i < shop.length; i++) {
			if (shop[i].name == didian) {
				break;
			}
		}
		if (i == shop.length) {
			return;
		}
		let player = await Read_player(usr_qq);
		let Price = shop[i].price * 0.3;
		if (player.灵石 < Price) {
			e.reply('你需要更多的灵石去打探消息');
			return;
		}
		await Add_灵石(usr_qq, -Price);
		let thing = await existshop(didian);
		let level = shop[i].Grade;
		let state = shop[i].state;
		switch (level) {
			case 1:
				level = '松懈';
				break;
			case 2:
				level = '戒备';
				break;
			case 3:
				level = '恐慌';
				break;
		}
		switch (state) {
			case 0:
				state = '营业';
				break;
			case 1:
				state = '打烊';
				break;
		}
		let didian_data = {
			name: shop[i].name,
			level,
			state,
			thing,
		};
		const data1 = await new Show(e).get_didianData(didian_data);
		let img = await puppeteer.screenshot('shop', {
			...data1,
		});
		e.reply(img);
		return;
	}
}

export async function Write_shop(shop) {
	let dir = path.join(__PATH.shop, `shop.json`);
	let new_ARR = JSON.stringify(shop, '', '\t');
	fs.writeFileSync(dir, new_ARR, 'utf8', (err) => {
		console.log('写入成功', err);
	});
	return;
}

export async function Read_shop() {
	let dir = path.join(`${__PATH.shop}/shop.json`);
	let shop = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	shop = JSON.parse(shop);
	return shop;
}

//判断是否还有物品
export async function existshop(didian) {
	let shop = await Read_shop();
	let i;
	let thing = [];
	for (i = 0; i < shop.length; i++) {
		if (shop[i].name == didian) {
			break;
		}
	}
	for (let j = 0; j < shop[i].one.length; j++) {
		if (shop[i].one[j].数量 > 0) {
			thing.push(shop[i].one[j]);
		}
	}
	if (thing.length > 0) {
		return thing;
	} else {
		return false;
	}
}
