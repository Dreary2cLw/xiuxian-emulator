//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import fs from 'fs';
import {
	Add_HP,
	Add_najie_thing,
	Add_修为,
	Add_血气,
	exist_najie_thing,
	existplayer,
	get_random_fromARR,
	isNotNull,
	player_efficiency,
	Read_equipment,
	Read_player,
	Write_equipment,
	Write_player,
} from '../Xiuxian/xiuxian.js';

/**
 * 全局变量
 */
/**
 * 境界模块
 */
export class Level extends plugin {
	constructor() {
		super({
			name: 'Yunzai_Bot_Level',
			dsc: '修仙模块',
			event: 'message',
			priority: 600,
			rule: [
				{
					reg: '^#突破$',
					fnc: 'Level_up_normal',
				},
				{
					reg: '^#幸运突破$',
					fnc: 'Level_up_luck',
				},
				{
					reg: '^#破体$',
					fnc: 'LevelMax_up_normal',
				},
				{
					reg: '^#幸运破体$',
					fnc: 'LevelMax_up_luck',
				},
				{
					reg: '^#渡劫$',
					fnc: 'fate_up',
				},
				{
					reg: '^#服用$',
					fnc: 'Useitems',
				},
				{
					reg: '^#羽化登仙$',
					fnc: 'Level_up_Max',
				},
			],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}

	async LevelMax_up(e, luck) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		let player = await Read_player(usr_qq);
		let now_level_id;
		if (!isNotNull(player.Physique_id)) {
			e.reply('请先#刷新信息');
			return;
		}
		now_level_id = data.LevelMax_list.find(
			(item) => item.level_id == player.Physique_id
		).level_id;
		let now_exp = player.血气;
		let need_exp = data.LevelMax_list.find(
			(item) => item.level_id == player.Physique_id
		).exp;
		if (now_exp < need_exp) {
			e.reply(`血气不足,再积累${need_exp - now_exp}血气后方可突破`);
			return;
		}
		if (now_level_id == 54) {
			e.reply(`你已突破至最高境界`);
			return;
		}
		let Time = this.xiuxianConfigData.CD.level_up;
		let now_Time = new Date().getTime(); //获取当前时间戳
		let shuangxiuTimeout = parseInt(60000 * Time);
		let last_time = await redis.get(
			'xiuxian:player:' + usr_qq + ':last_LevelMaxup_time'
		); //获得上次的时间戳,
		last_time = parseInt(last_time);
		if (now_Time < last_time + shuangxiuTimeout) {
			let Couple_m = Math.trunc(
				(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
			);
			let Couple_s = Math.trunc(
				((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
			);
			e.reply('突破正在CD中，' + `剩余cd:  ${Couple_m}分 ${Couple_s}秒`);
			return;
		}
		let rand = Math.random();
		let prob = 1 - now_level_id / 60;
		if (luck) {
			e.reply('你使用了幸运草，减少50%失败概率。');
			prob = prob + (1 - prob) * 0.5;
			await Add_najie_thing(usr_qq, '幸运草', '道具', -1);
		}
		//失败了
		if (rand > prob) {
			let bad_time = Math.random(); //增加多种突破失败情况，顺滑突破丢失修为曲线
			if (bad_time > 0.9) {
				await Add_血气(usr_qq, -1 * need_exp * 0.4);
				await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
				e.reply(
					`突然听到一声鸡叫,鸡..鸡..鸡...鸡你太美！！！是翠翎恐蕈，此地不适合突破，快跑！险些走火入魔，丧失了` +
						need_exp * 0.4 +
						'血气'
				);
				return;
			} else if (bad_time > 0.8) {
				await Add_血气(usr_qq, -1 * need_exp * 0.2);
				await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
				e.reply(
					`突破瓶颈时想到树脂满了,险些走火入魔，丧失了` + need_exp * 0.2 + '血气'
				);
				return;
			} else if (bad_time > 0.7) {
				await Add_血气(usr_qq, -1 * need_exp * 0.1);
				await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
				e.reply(
					`突破瓶颈时想起背后是药园，刚种下掣电树种子，不能被破坏了，打断突破，嘴角流血，丧失了` +
						need_exp * 0.1 +
						'血气'
				);
				return;
			} else if (bad_time > 0.1) {
				await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
				e.reply(`破体失败，不要气馁,等到${Time}分钟后再尝试吧`);
				return;
			} else {
				await Add_血气(usr_qq, -1 * need_exp * 0.2);
				await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
				e.reply(
					`突破瓶颈时想起怡红院里的放肆,想起了金银坊里的狂热,险些走火入魔，丧失了` +
						need_exp * 0.2 +
						'血气'
				);
				return;
			}
		}
		//线性概率获得仙宠
		if (now_level_id < 42) {
			let random = Math.random();
			if (random < ((now_level_id / 60) * 0.5) / 5) {
				let random2 = Math.trunc(Math.random() * data.changzhuxianchon.length);
				random2 = (Math.ceil((random2 + 1) / 5) - 1) * 5;
				e.reply(
					'修仙本是逆天而行,神明愿意降下自己的恩泽.这只[' +
						data.changzhuxianchon[random2].name +
						'],将伴随与你,愿你修仙路上不再独身一人.`'
				);
				await Add_najie_thing(usr_qq, data.changzhuxianchon[random2].name, '仙宠', 1);
			}
		} else {
			let random = Math.random();
			if (random < (now_level_id / 60) * 0.5) {
				let random2 = Math.trunc(Math.random() * data.changzhuxianchon.length);
				random2 = (Math.ceil((random2 + 1) / 5) - 1) * 5;
				e.reply(
					'修仙本是逆天而行,神明愿意降下自己的恩泽.这只[' +
						data.changzhuxianchon[random2].name +
						'],将伴随与你,愿你修仙路上不再独身一人.`'
				);
				await Add_najie_thing(usr_qq, data.changzhuxianchon[random2].name, '仙宠', 1);
			}
		}
		player.Physique_id = now_level_id + 1;
		player.血气 -= need_exp;
		await Write_player(usr_qq, player);
		let equipment = await Read_equipment(usr_qq);
		await Write_equipment(usr_qq, equipment);
		await Add_HP(usr_qq, 99999999);
		let level = data.LevelMax_list.find(
			(item) => item.level_id == player.Physique_id
		).level;
		e.reply(`突破成功至${level}`);
		await redis.set('xiuxian:player:' + usr_qq + ':last_LevelMaxup_time', now_Time);
		return;
	}

	//突破
	async Level_up(e, luck) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无账号
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//读取信息
		let player = await Read_player(usr_qq);
		//境界
		let now_level = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level;
		//拦截渡劫期
		if (now_level == '渡劫期') {
			//检查仙门是否开启！
			if (player.power_place == 0) {
				e.reply('你已度过雷劫，请感应仙门#羽化登仙');
			} else {
				e.reply(`请先渡劫！`);
			}
			return;
		}
		//根据名字取找境界id
		//根据名字找，不是很合适了！
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#刷新信息');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		//真仙突破
		if (
			now_level_id >= 51 &&
			player.灵根.name != '天五灵根' &&
			player.灵根.name != '垃圾五灵根' &&
			player.灵根.name != '鸡神圣体' &&
			player.灵根.name != '九转轮回体' &&
			player.灵根.name != '九重魔功' &&
			player.灵根.name != '仙之心·火' &&
			player.灵根.name != '仙之心·水' &&
			player.灵根.name != '仙之心·雷' &&
			player.灵根.name != '仙之心·冰' &&
			player.灵根.name != '仙之心·岩' &&
			player.灵根.name != '仙之心·风' &&
			player.灵根.name != '仙之心·木'
		) {
			e.reply(`你灵根不齐，无成帝的资格！请先夺天地之造化，修补灵根后再来突破吧`);
			return;
		}
		let lvup = await redis.get('xiuxian:player:' + usr_qq + ':levelup');
		// if(now_level_id==21 && lvup!=1){
		// 	e.reply("突破后灵根将被固化，无法使用【洗根水】进行洗髓！回复:【】或者【先不突破】进行选择");
		// 	this.setContext('yes');
		//     return;
		// }
		// else if(now_level_id==21&&lvup==1){
		// 	redis.set("xiuxian:player:" + usr_qq + ":levelup", 0);
		// }
		//超凡入圣突破
		if (now_level_id == 64) {
			//检查是否已有凡人境
			let LevelUP = await fanren();
			if (LevelUP != 1) {
				e.reply(`这方世界已有化凡！`);
				return;
			}
		}
		//凡人突破
		if (now_level_id == 80) {
			return;
		}
		let now_exp = player.修为;
		//修为
		let need_exp = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).exp;
		if (now_exp < need_exp) {
			e.reply(`修为不足,再积累${need_exp - now_exp}修为后方可突破`);
			return;
		}
		let Time = this.xiuxianConfigData.CD.level_up;
		let now_Time = new Date().getTime(); //获取当前时间戳
		let shuangxiuTimeout = parseInt(60000 * Time);
		if(player.灵根.type == '转生'){
			shuangxiuTimeout = parseInt(6000);
		}
		let last_time = await redis.get(
			'xiuxian:player:' + usr_qq + ':last_Levelup_time'
		); //获得上次的时间戳,
		last_time = parseInt(last_time);
		if (now_Time < last_time + shuangxiuTimeout) {
			let Couple_m = Math.trunc(
				(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
			);
			let Couple_s = Math.trunc(
				((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
			);
			e.reply('突破正在CD中，' + `剩余cd:  ${Couple_m}分 ${Couple_s}秒`);
			return;
		}
		//随机数
		let rand = Math.random();
		let prob = 1 - now_level_id / 60;
		if (luck) {
			e.reply('你使用了幸运草，减少50%失败概率。');
			prob = prob + (1 - prob) * 0.5;
			await Add_najie_thing(usr_qq, '幸运草', '道具', -1);
		}
		//突破失败了！
		if (player.breakthrough) {
			prob += 0.2;
			player.breakthrough = false;
			await Write_player(usr_qq, player);
		}
		if (rand > prob) {
			let bad_time = Math.random(); //增加多种突破失败情况，顺滑突破丢失修为曲线
			if (bad_time > 0.9) {
				await Add_修为(usr_qq, -1 * need_exp * 0.4);
				await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time); //获得上次的时间戳
				e.reply(
					`突然听到一声鸡叫,鸡..鸡..鸡...鸡你太美！！！是翠翎恐蕈，此地不适合突破，快跑！险些走火入魔，丧失了` +
						need_exp * 0.4 +
						'修为'
				);
				return;
			} else if (bad_time > 0.8) {
				await Add_修为(usr_qq, -1 * need_exp * 0.2);
				await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time); //获得上次的时间戳
				e.reply(
					`突破瓶颈时想到树脂满了,险些走火入魔，丧失了` + need_exp * 0.2 + '修为'
				);
				return;
			} else if (bad_time > 0.7) {
				await Add_修为(usr_qq, -1 * need_exp * 0.1);
				await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time); //获得上次的时间戳
				e.reply(
					`突破瓶颈时想起背后是药园，刚种下掣电树种子，不能被破坏了，打断突破，嘴角流血，丧失了` +
						need_exp * 0.1 +
						'修为'
				);
				return;
			} else if (bad_time > 0.1) {
				await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time); //获得上次的时间戳
				e.reply(`突破失败，不要气馁,等到${Time}分钟后再尝试吧`);
				return;
			} else {
				await Add_修为(usr_qq, -1 * need_exp * 0.2);
				await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time); //获得上次的时间戳
				e.reply(
					`突破瓶颈时想起怡红院里的放肆,想起了金银坊里的狂热,险些走火入魔，丧失了` +
						need_exp * 0.2 +
						'修为'
				);
				return;
			}
		}
		//线性概率获得仙宠
		if (now_level_id < 42) {
			let random = Math.random();
			if (random < ((now_level_id / 60) * 0.5) / 5) {
				let random2 = Math.trunc(Math.random() * data.changzhuxianchon.length);
				random2 = (Math.ceil((random2 + 1) / 5) - 1) * 5;
				e.reply(
					'修仙本是逆天而行,神明愿意降下自己的恩泽.这只[' +
						data.changzhuxianchon[random2].name +
						'],将伴随与你,愿你修仙路上不再独身一人.`'
				);
				await Add_najie_thing(usr_qq, data.changzhuxianchon[random2].name, '仙宠', 1);
			}
		} else {
			let random = Math.random();
			if (random < (now_level_id / 60) * 0.5) {
				let random2 = Math.trunc(Math.random() * data.changzhuxianchon.length);
				random2 = (Math.ceil((random2 + 1) / 5) - 1) * 5;
				e.reply(
					'修仙本是逆天而行,神明愿意降下自己的恩泽.这只[' +
						data.changzhuxianchon[random2].name +
						'],将伴随与你,愿你修仙路上不再独身一人.`'
				);
				await Add_najie_thing(usr_qq, data.changzhuxianchon[random2].name, '仙宠', 1);
			}
		}
		//境界提升,修为扣除,攻防血重新加载,当前血量拉满
		player.level_id = now_level_id + 1;
		player.修为 -= need_exp;
		await Write_player(usr_qq, player);
		//刷新装备
		let equipment = await Read_equipment(usr_qq);
		await Write_equipment(usr_qq, equipment);
		//补血
		await Add_HP(usr_qq, 99999999);
		//查境界名
		let level = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level;
		e.reply(`突破成功,当前境界为${level}`);
		//记录cd
		await redis.set('xiuxian:player:' + usr_qq + ':last_Levelup_time', now_Time);
		return;
	}

	async yes(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		/** 内容 */
		let usr_qq = e.user_id;
		let new_msg = this.e.message;
		let choice = new_msg[0].text;
		let now = new Date();
		let nowTime = now.getTime(); //获取当前时间戳
		if (choice == '先不突破') {
			await this.reply('放弃突破');
			this.finish('yes');
			return;
		} else if (choice == '确认突破') {
			redis.set('xiuxian:player:' + usr_qq + ':levelup', 1);
			e.reply('请再次/突破，或#幸运突破！');
			//console.log(this.getContext().recall);
			this.finish('yes');
			return;
		} else {
			this.setContext('yes');
			await this.reply(
				'突破后灵根将被固化，无法使用【洗根水】进行洗髓！回复:【确认突破】或者【先不突破】进行选择'
			);
			return;
		}
		/** 结束上下文 */
	}

	async Level_up_normal(e) {
		this.Level_up(e, false);
	}

	async LevelMax_up_normal(e) {
		this.LevelMax_up(e, false);
	}

	async Level_up_luck(e) {
		let usr_qq = e.user_id;
		let x = await exist_najie_thing(usr_qq, '幸运草', '道具');
		if (!x) {
			e.reply('醒醒，你没有道具【幸运草】!');
			return;
		}
		this.Level_up(e, true);
	}

	async LevelMax_up_luck(e) {
		let usr_qq = e.user_id;
		let x = await exist_najie_thing(usr_qq, '幸运草', '道具');
		if (!x) {
			e.reply('醒醒，你没有道具【幸运草】!');
			return;
		}
		this.LevelMax_up(e, true);
	}

	//渡劫
		async fate_up(e) {		
		let usr_qq = e.user_id;
		//有无账号
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//不开放私聊
		if (!e.isGroup) {
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		let player = await Read_player(usr_qq);
		//境界
		let now_level = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level;
		if (now_level != '渡劫期') {
			e.reply(`你非渡劫期修士！`);
			return;
		}
		if (player.linggenshow == 1) {
			e.reply(`你灵根未开，不能渡劫！`);
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		//不为空
		if (action != null) {
			let action_end_time = action.end_time;
			let now_time = new Date().getTime();
			if (now_time <= action_end_time) {
				let m = parseInt((action_end_time - now_time) / 1000 / 60);
				let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
				e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
				return;
			}
		}
		if (player.power_place == 0) {
			//已经开了
			e.reply('你已度过雷劫，请感应仙门#羽化登仙');
			return;
		}
		//看看当前血量
		let now_HP = player.当前血量;
		let list_HP = data.Level_list.find((item) => item.level == now_level).基础血量;
		if (now_HP < list_HP * 0.9) {
			player.当前血量 = 1;
			await Write_player(usr_qq, player);
			e.reply(player.名号 + '血量亏损，强行渡劫后晕倒在地！');
			return;
		}
		//境界id
		let now_level_id = data.Level_list.find(
			(item) => item.level == now_level
		).level_id;
		if (now_level_id == 54) {
			e.reply(`您已是此界凡人`);
			return;
		}
		//修为
		let now_exp = player.修为;
		//修为
		let need_exp;
		try {
			need_exp = data.Level_list.find((item) => item.level == now_level).exp;
		} catch {
			need_exp = data.Level_list.find((item) => item.level_id == now_level_id).exp;
		}
		if (now_exp < need_exp) {
			e.reply(`修为不足,再积累${need_exp - now_exp}修为后方可突破`);
			return;
		}
		//当前系数计算
		let x = await dujie(usr_qq);
		//默认为3
		let y = 3;
		if (player.灵根.type == '伪灵根') {
			y = 5;
		} else if (player.灵根.type == '真灵根') {
			y = 7;
		} else if (player.灵根.type == '天灵根') {
			y = 10;
		} else if (player.灵根.type == '体质') {
			y = 14;
		} else if (player.灵根.type == '转生' || player.灵根.type == '魔头') {
			y = 25;
		} else if (player.灵根.type == '转圣') {
			y = 30;
		} else {
			y = 15;
		}
		//渡劫系数区间
		let n = 1400; //最低
		let p = 300; //变动
		let m = n + p;
		if (x <= n) {
			//没有达到最低要求
			player.当前血量 = 0;
			player.修为 -= parseInt(need_exp / 4);
			await Write_player(usr_qq, player);
			e.reply('天空一声巨响，未降下雷劫，就被天道的气势震死了。');
			return;
		}
		//渡劫成功率
		let l = (x - n) / (p + y * 0.08);
		l = l * 100;
		l = l.toFixed(2);
		e.reply('天道：就你，也敢逆天改命？');
		e.reply(
			'[' +
				player.名号 +
				']' +
				'\n雷抗：' +
				x +
				'\n成功率：' +
				l +
				'%\n灵根：' +
				player.灵根.type +
				'\n需渡' +
				y +
				'道雷劫\n将在一分钟后落下\n[温馨提示]\n请把其他渡劫期打死后再渡劫！'
		);
		//在redis中添加状态
		let time = 60; //时间(分)九个雷，//60分钟。防延迟。
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '渡劫', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关状态-关闭
			working: '1', //降妖状态-关闭
			Place_action: '1', //秘境状态---关闭
			Place_actionplus: '1', //沉迷---关闭
			power_up: '0', //渡劫状态--开启
			///以下都不是基础字段
			power_Grade: y, //雷等级，也就是最多次数限制
			power_n: n, //雷畸变最小区间
			power_m: m, //雷畸变最大区间
		};
		//消息设置
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		//初始化雷数
		redis.set('xiuxian:player:' + usr_qq + ':power_aconut', 1);
		//redis设置动作
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		return;
	}

	//#羽化登仙
	//专门为渡劫期设计的指令
	async Level_up_Max(e) {
		let usr_qq = e.user_id;
		//有无账号
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//不开放私聊
		if (!e.isGroup) {
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//读取信息
		let player = await Read_player(usr_qq);
		//境界
		let now_level = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level;
		if (now_level != '渡劫期') {
			e.reply(`你非渡劫期修士！`);
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		//不为空
		if (action != null) {
			let action_end_time = action.end_time;
			let now_time = new Date().getTime();
			if (now_time <= action_end_time) {
				let m = parseInt((action_end_time - now_time) / 1000 / 60);
				let s = parseInt((action_end_time - now_time - m * 60 * 1000) / 1000);
				e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
				return;
			}
		}
		if (player.power_place != 0) {
			e.reply('请先渡劫！');
			return;
		}
		//需要的修为
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#刷新信息');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		let now_exp = player.修为;
		//修为
		let need_exp = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).exp;
		if (now_exp < need_exp) {
			e.reply(`修为不足,再积累${need_exp - now_exp}修为后方可成仙！`);
			return;
		}
		//零，开仙门
		if (player.power_place == 0) {
			e.reply(
				'天空一声巨响，一道虚影从眼中浮现，突然身体微微颤抖，似乎感受到了什么，' +
					player.名号 +
					'来不及思索，立即向前飞去！只见万物仰头相望，似乎感觉到了，也似乎没有感觉，殊不知......'
			);
			now_level_id = now_level_id + 1;
			player.level_id = now_level_id;
			player.修为 -= need_exp;
			await Write_player(usr_qq, player);
			let equipment = await Read_equipment(usr_qq);
			await Write_equipment(usr_qq, equipment);
			await Add_HP(usr_qq, 99999999);
			//突破成仙人
			if (now_level_id >= 42) {
				let player = data.getData('player', usr_qq);
				if (!isNotNull(player.宗门)) {
					return;
				}
				//有宗门
				if (player.宗门.职位 != '宗主') {
					let ass = data.getAssociation(player.宗门.宗门名称);
					ass[player.宗门.职位] = ass[player.宗门.职位].filter((item) => item != usr_qq);
					ass['所有成员'] = ass['所有成员'].filter((item) => item != usr_qq);
					data.setAssociation(ass.宗门名称, ass);
					delete player.宗门;
					data.setData('player', usr_qq, player);
					await player_efficiency(usr_qq);
					e.reply('退出宗门成功');
				} else {
					let ass = data.getAssociation(player.宗门.宗门名称);
					if (ass.所有成员.length < 2) {
						fs.rmSync(`${data.filePathMap.association}/${player.宗门.宗门名称}.json`);
						delete player.宗门; //删除存档里的宗门信息
						data.setData('player', usr_qq, player);
						await player_efficiency(usr_qq);
						e.reply('一声巨响,原本的宗门轰然倒塌,随着流沙沉没,世间再无半分痕迹');
					} else {
						ass['所有成员'] = ass['所有成员'].filter((item) => item != usr_qq); //原来的成员表删掉这个B
						delete player.宗门; //删除这个B存档里的宗门信息
						data.setData('player', usr_qq, player);
						await player_efficiency(usr_qq);
						//随机一个幸运儿的QQ,优先挑选等级高的
						let randmember_qq;
						if (ass.副宗主.length > 0) {
							randmember_qq = await get_random_fromARR(ass.副宗主);
						} else if (ass.长老.length > 0) {
							randmember_qq = await get_random_fromARR(ass.长老);
						} else if (ass.内门弟子.length > 0) {
							randmember_qq = await get_random_fromARR(ass.内门弟子);
						} else {
							randmember_qq = await get_random_fromARR(ass.所有成员);
						}
						let randmember = await data.getData('player', randmember_qq); //获取幸运儿的存档
						ass[randmember.宗门.职位] = ass[randmember.宗门.职位].filter(
							(item) => item != randmember_qq
						); //原来的职位表删掉这个幸运儿
						ass['宗主'] = randmember_qq; //新的职位表加入这个幸运儿
						randmember.宗门.职位 = '宗主'; //成员存档里改职位
						data.setData('player', randmember_qq, randmember); //记录到存档
						data.setData('player', usr_qq, player);
						data.setAssociation(ass.宗门名称, ass); //记录到宗门
						e.reply(
							`飞升前,遵循你的嘱托,${randmember.名号}将继承你的衣钵,成为新一任的宗主`
						);
					}
				}
			}
			return;
		}
		return;
	}
}

export async function dujie(user_qq) {
	let usr_qq = user_qq;
	let player = await Read_player(usr_qq);
	//根据当前血量才算
	//计算系数
	let new_blood = player.当前血量;
	let new_defense = player.防御;
	let new_attack = player.攻击;
	//渡劫期基础血量为1600000。防御800000，攻击800000
	new_blood = new_blood / 100000;
	new_defense = new_defense / 100000;
	new_attack = new_attack / 100000;
	//取值比例4.6.2
	new_blood = (new_blood * 4) / 10;
	new_defense = (new_defense * 6) / 10;
	new_attack = (new_attack * 2) / 10;
	//基础厚度
	let N = new_blood + new_defense;
	//你的系数
	let x = N * new_attack;
	//系数只取到后两位
	//灵根加成
	if (player.灵根.type == '真灵根') {
		x = x * (1 + 0.5);
	} else if (player.灵根.type == '天灵根') {
		x = x * (1 + 0.75);
	} else {
		x = x * (1 + 1);
	}
	x = x.toFixed(2);
	return x;
}

/**
 *
 * 查找是否有凡人
 */
export async function fanren() {
	//获取缓存中人物列表
	let playerList = [];
	let files = fs
		.readdirSync('./plugins/xiuxian-emulator-plugin/resources/data/xiuxian_player')
		.filter((file) => file.endsWith('.json'));
	for (let file of files) {
		file = file.replace('.json', '');
		playerList.push(file);
	}
	//默认为1
	let x = '1';
	for (let player_id of playerList) {
		let player = data.getData('player', player_id);
		//搜索境界，有凡人，就变0
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		if (now_level_id == 54) {
			x = '0';
		}
	}
	return x;
}
