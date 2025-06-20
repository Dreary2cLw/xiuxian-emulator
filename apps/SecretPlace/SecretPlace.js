//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import puppeteer from '../../../../lib/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import {__PATH,
	Add_najie_thing,
	Add_修为,
	Add_灵石,
	exist_najie_thing,
	existplayer,
	find_renwu,
	ForwardMsg,
	isNotNull,
	Read_player,
	Read_renwu,
	sleep,
	Write_renwu,
} from '../Xiuxian/xiuxian.js';
import { add_mingdang, add_time } from '../jiance/jiance.js';
import Show from '../../model/show.js';
import {Write_player} from "../Xiuxian/xiuxian.js";

/**
 * 秘境模块
 */
let allaction = false;

export class SecretPlace extends plugin {
	constructor() {
		super({
			name: 'Yunzai_Bot_SecretPlace',
			dsc: '修仙模块',
			event: 'message',
			/**
			 * 优先级，数字越小等级越高，建议优先级600
			 */
			priority: 600,
			rule: [
				{
					reg: '^#修仙状态$',
					fnc: 'Xiuxianstate',
				},
				{
					reg: '^#秘境$',
					fnc: 'Secretplace',
				},
				{
					reg: '^#寻宝$',
					fnc: 'xunbao',
				},

				{
					reg: '^#降临秘境.*$',
					fnc: 'Gosecretplace',
				},
				{
					reg: '^#禁地$',
					fnc: 'Forbiddenarea',
				},
				{
					reg: '^#前往禁地.*$',
					fnc: 'Goforbiddenarea',
				},
				{
					reg: '^#仙府$',
					fnc: 'Timeplace',
				},
				{
					reg: '^#探索仙府$',
					fnc: 'GoTimeplace',
				},
				{
					reg: '^#仙境$',
					fnc: 'Fairyrealm',
				},
				{
					reg: '^#镇守仙境.*$',
					fnc: 'Gofairyrealm',
				},
				{
					reg: '^#逃离',
					fnc: 'Giveup',
				},
			],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}

	async Xiuxianstate(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		await Go(e);
		allaction = false;
		return;
	}

	//秘境地点
	async Secretplace(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
	 let img = await get_map_img(e);
		e.reply(img);
		return;
	}

	//禁地
	async Forbiddenarea(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let img = await get_jindi_img(e);
		e.reply(img);
		return;
	}

	//限定仙府
	async Timeplace(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		e.reply('仙府乃民间传说之地,请自行探索');
	}

	async xunbao(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let img = await get_xunbao_img(e);
		e.reply(img);
		return;
	}


	//仙境
	async Fairyrealm(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let img = await get_xian_img(e);
		e.reply(img);
		return;
	}

	//降临秘境
	async Gosecretplace(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		await Go(e);
		if (allaction) {
		} else {
			return;
		}
		allaction = false;
		let player = await Read_player(usr_qq);
		let didian = e.msg.replace('#降临秘境', '');
		didian = didian.trim();
		let weizhi = await data.didian_list.find((item) => item.name == didian);
		if (!isNotNull(weizhi)) {
			return;
		}
		// if(didian=="广寒宫"){
		// let yes=await exist_najie_thing(usr_qq,"仙子邀约","道具")
		// if(!yes){
		//     e.reply("你没有[仙子邀约],无法到达广寒宫")
		//     return
		// }else{
		// await Add_najie_thing(usr_qq,"仙子邀约","道具",-1)
		// }

		if (player.灵石 < weizhi.Price) {
			e.reply('没有灵石寸步难行,攒到' + weizhi.Price + '灵石才够哦~');
			return true;
		}
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#一键同步');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		// if (now_level_id > 41) {
		//     e.reply("境界不符！");
		//     return;
		// }
		let rate = player.occupation_level;
		if (player.occupation == '采药师' && rate < 15 && didian == '须弥') {
			e.reply('冒险等级不足(职业等级不足)');
			return;
		}
		if (didian == '广寒宫') {
			let number = await exist_najie_thing(usr_qq, '仙子邀约', '道具');
			if (isNotNull(number) && number >= 1) {
				await Add_najie_thing(usr_qq, '仙子邀约', '道具', -1);
			} else {
				e.reply('你没有足够数量的"仙子邀约"');
				return;
			}
		}
		if (player.occupation != '采药师' && didian == '须弥') {
			e.reply('由于没有带虚空终端，被教令院抓了起来(您不是采药师)');
			return;
		}
		//记录时间
		await add_mingdang(usr_qq);
		await add_time(usr_qq);
		let Price = weizhi.Price;
		await Add_灵石(usr_qq, -Price);
		const time = this.xiuxianConfigData.CD.secretplace; //时间（分钟）
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '历练', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关
			working: '1', //降妖
			Place_action: '0', //秘境状态---开启
			Place_actionplus: '1', //沉迷秘境状态---关闭
			power_up: '1', //渡劫状态--关闭
			mojie: '1', //魔界状态---关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
			//这里要保存秘境特别需要留存的信息
			Place_address: weizhi,
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let chazhao = await find_renwu(A);
		if (chazhao == 0) {
		} else if (renwu[i].wancheng3 == 1) {
			renwu[i].jilu3 += 1;
			await Write_renwu(renwu);
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		e.reply('开始降临' + didian + ',' + time + '分钟后归来!');
		return;
	}

	//前往禁地
	async Goforbiddenarea(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		await Go(e);
		if (allaction) {
		} else {
			return;
		}
		allaction = false;
		let player = await Read_player(usr_qq);
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#一键同步');
			return;
		}
		if (!isNotNull(player.power_place)) {
			e.reply('请#一键同步');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		if (now_level_id < 22) {
			e.reply('没有达到化神之前还是不要去了');
			return;
		}
		let didian = await e.msg.replace('#前往禁地', '');
		didian = didian.trim();
		let weizhi = await data.forbiddenarea_list.find((item) => item.name == didian);
		// if (player.power_place == 0 && weizhi.id != 666) {
		//     e.reply("仙人不得下凡")
		//     return;
		//  }
		if (!isNotNull(weizhi)) {
			return;
		}
		if (didian == '提瓦特') {
			let yuansu = [
				'仙之心·火',
				'仙之心·水',
				'仙之心·雷',
				'仙之心·岩',
				'仙之心·冰',
				'仙之心·风',
				'仙之心·木',
			];
			let lingen = player.灵根.name;
			if (
				!(
					lingen == yuansu[0] ||
					lingen == yuansu[1] ||
					lingen == yuansu[2] ||
					lingen == yuansu[3] ||
					lingen == yuansu[4] ||
					lingen == yuansu[5] ||
					lingen == yuansu[6]
				)
			) {
				e.reply('你是元素灵根吗,就来提瓦特大陆');
				return;
			}
		}
		if (didian == '诸神黄昏·旧神界') {
			if (now_level_id < 41) {
				e.reply('没有达到仙人之前还是不要去了');
				return;
			}
		}
		let Price = weizhi.Price;
		if((await exist_najie_thing(usr_qq, '黄金门票', '道具'))){
			Price = 0;
			weizhi.experience = 0;
			e.reply(player.名号 + '使用了黄金门票,本次禁地免费');
			await Add_najie_thing(usr_qq, '黄金门票', '道具', -1);
		}else{
			if (player.灵石 < weizhi.Price) {
				e.reply('没有灵石寸步难行,攒到' + weizhi.Price + '灵石才够哦~');
				return true;
			}
			if (player.修为 < weizhi.experience) {
				e.reply('你需要积累' + weizhi.experience + '修为，才能抵抗禁地魔气！');
				return true;
			}
		}
		await Add_灵石(usr_qq, -Price);
		await Add_修为(usr_qq, -weizhi.experience);
		const time = this.xiuxianConfigData.CD.forbiddenarea; //时间（分钟）
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '禁地', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关
			working: '1', //降妖
			Place_action: '0', //秘境状态---开启
			Place_actionplus: '1', //沉迷秘境状态---关闭
			power_up: '1', //渡劫状态--关闭
			mojie: '1', //魔界状态---关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
			//这里要保存秘境特别需要留存的信息
			Place_address: weizhi,
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let chazhao = await find_renwu(A);
		if (chazhao == 0) {
		} else if (renwu[i].wancheng3 == 1) {
			renwu[i].jilu3 += 1;
			await Write_renwu(renwu);
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		e.reply('正在前往' + weizhi.name + ',' + time + '分钟后归来!');
		return;
	}

	//探索仙府
	async GoTimeplace(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		await Go(e);
		if (allaction) {
		} else {
			return;
		}
		allaction = false;
		let player = await Read_player(usr_qq);
		let didianlist = ['无欲天仙', '仙遗之地'];
		let suiji = Math.round(Math.random()); //随机一个地方
		let yunqi = Math.random(); //运气随机数
		await sleep(1000);
		e.reply('你在冲水堂发现有人上架了一份仙府地图');
		let didian = didianlist[suiji]; //赋值
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#一键同步');
			return;
		}
		await sleep(1000);
		if (yunqi > 0.9) {
			//10%寄
			if (player.灵石 < 50000) {
				e.reply('还没看两眼就被看堂的打手撵了出去说:“哪来的穷小子,不买别看”');
				return;
			}
			e.reply(
				'价格为5w,你觉得特别特别便宜,赶紧全款拿下了,历经九九八十天,到了后发现居然是仙湖游乐场！'
			);
			await Add_灵石(usr_qq, -50000);
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		if (now_level_id < 21) {
			e.reply('到了地图上的地点，结果你发现,你尚未达到化神,无法抵御灵气压制');
			return;
		}
		let weizhi = await data.timeplace_list.find((item) => item.name == didian);
		if (!isNotNull(weizhi)) {
			e.reply('报错！地点错误，请找群主反馈');
			return;
		}
		if (player.灵石 < weizhi.Price) {
			e.reply('你发现标价是' + weizhi.Price + ',你买不起赶紧溜了');
			return;
		}
		if (player.修为 < 100000) {
			e.reply(
				'到了地图上的地点，发现洞府前有一句前人留下的遗言:‘至少有10w修为才能抵御仙威！’'
			);
			return true;
		}
		let dazhe = 1;
		if (
			(await exist_najie_thing(usr_qq, '仙府通行证', '道具')) &&
			player.魔道值 < 1 &&
			(player.灵根.type == '转生' || player.level_id > 41)
		) {
			dazhe = 0;
			e.reply(player.名号 + '使用了道具仙府通行证,本次仙府免费');
			await Add_najie_thing(usr_qq, '仙府通行证', '道具', -1);
		}
		let Price = weizhi.Price * dazhe;
		await Add_灵石(usr_qq, -Price);
		const time = this.xiuxianConfigData.CD.timeplace; //时间（分钟）
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '探索', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关
			working: '1', //降妖
			Place_action: '0', //秘境状态---开启
			Place_actionplus: '1', //沉迷秘境状态---关闭
			power_up: '1', //渡劫状态--关闭
			mojie: '1', //魔界状态---关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
			//这里要保存秘境特别需要留存的信息
			Place_address: weizhi,
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let chazhao = await find_renwu(A);
		if (chazhao == 0) {
		} else if (renwu[i].wancheng3 == 1) {
			renwu[i].jilu3 += 1;
			await Write_renwu(renwu);
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		await Add_修为(usr_qq, -100000);
		if (suiji == 0) {
			e.reply(
				'你买下了那份地图,历经九九八十一天,终于到达了地图上的仙府,洞府上模糊得刻着[' +
					weizhi.name +
					'仙府]你兴奋地冲进去探索机缘,被强大的仙气压制，消耗了100000修为成功突破封锁闯了进去' +
					time +
					'分钟后归来!'
			);
		}
		if (suiji == 1) {
			e.reply(
				'你买下了那份地图,历经九九八十一天,终于到达了地图上的地点,这座洞府仿佛是上个末法时代某个仙人留下的遗迹,你兴奋地冲进去探索机缘,被强大的仙气压制，消耗了100000修为成功突破封锁闯了进去' +
					time +
					'分钟后归来!'
			);
		}
		return;
	}

	//前往仙境
	async Gofairyrealm(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		await Go(e);
		if (allaction) {
		} else {
			return;
		}
		allaction = false;
		let player = await Read_player(usr_qq);
		let didian = e.msg.replace('#镇守仙境', '');
		didian = didian.trim();
		let weizhi = await data.Fairyrealm_list.find((item) => item.name == didian);
		if (!isNotNull(weizhi)) {
			return;
		}
		if (player.灵石 < weizhi.Price) {
			e.reply('没有灵石寸步难行,攒到' + weizhi.Price + '灵石才够哦~');
			return true;
		}
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			e.reply('请先#一键同步');
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		if (now_level_id < 42) {
			return;
		} else {
			if (!isNotNull(player.power_place)) {
				e.reply('请#一键同步');
				return;
			}
			if (player.power_place != 0) {
				e.reply('你已无法重返仙界！');
				return;
			}
		}
		//记录时间
		if (didian == '仙界矿场') {
			await add_mingdang(usr_qq);
			await add_time(usr_qq);
		}
		let dazhe = 1;
		if (
			(await exist_najie_thing(usr_qq, '杀神崖通行证', '道具')) &&
			player.魔道值 < 1 &&
			(player.灵根.type == '转生' || player.level_id > 41) &&
			didian == '杀神崖'
		) {
			dazhe = 0;
			e.reply(player.名号 + '使用了道具杀神崖通行证,本次仙境免费');
			await Add_najie_thing(usr_qq, '杀神崖通行证', '道具', -1);
		} else if (
			(await exist_najie_thing(usr_qq, '仙境优惠券', '道具')) &&
			player.魔道值 < 1 &&
			(player.灵根.type == '转生' || player.level_id > 41)
		) {
			dazhe = 0.7;
			e.reply(player.名号 + '使用了道具仙境优惠券,本次消耗减少30%');
			await Add_najie_thing(usr_qq, '仙境优惠券', '道具', -1);
		}
		let Price = weizhi.Price * dazhe;
		await Add_灵石(usr_qq, -Price);
		const time = this.xiuxianConfigData.CD.secretplace; //时间（分钟）
		let action_time = 60000 * time; //持续时间，单位毫秒
		let arr = {
			action: '历练', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关
			working: '1', //降妖
			Place_action: '0', //秘境状态---开启
			Place_actionplus: '1', //沉迷秘境状态---关闭
			power_up: '1', //渡劫状态--关闭
			mojie: '1', //魔界状态---关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
			//这里要保存秘境特别需要留存的信息
			Place_address: weizhi,
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		let A = e.user_id;
		let user_A = A;
		let renwu = await Read_renwu();
		let i = await found(user_A);
		let chazhao = await find_renwu(A);
		if (chazhao == 0) {
		} else if (renwu[i].wancheng3 == 1) {
			renwu[i].jilu3 += 1;
			await Write_renwu(renwu);
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
		e.reply('开始镇守' + didian + ',' + time + '分钟后归来!');
		return;
	}

	async Giveup(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			e.reply('没存档你逃个锤子!');
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//查询redis中的人物动作
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action);
		//不为空，有状态
		if (action != null) {
			//是在秘境状态
			if (
				action.Place_action == '0' ||
				action.Place_actionplus == '0' ||
				action.mojie == '0'
			) {
				//把状态都关了
				let arr = action;
				arr.is_jiesuan = 1; //结算状态
				arr.shutup = 1; //闭关状态
				arr.working = 1; //降妖状态
				arr.power_up = 1; //渡劫状态
				arr.Place_action = 1; //秘境
				arr.Place_actionplus = 1; //沉迷状态
				arr.mojie = 1;
				arr.end_time = new Date().getTime(); //结束的时间也修改为当前时间
				delete arr.group_id; //结算完去除group_id
				await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr));
				e.reply('你已逃离！');
				return;
			}
		}
		return;
	}
}
export async  function get_map_img(e, thing_type) {
	let map_list;
	let usr_qq = e.user_id;
	try {
		map_list = await Read_mapName();
	} catch {
		map_list = await Read_mapName();
	}
	let supermarket_data = {
		user_id: usr_qq,
		Exchange_list: map_list,
	};
	const data1 = await new Show(e).get_mapData(supermarket_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_jindi_img(e, thing_type) {
	let jindi_list;
	let usr_qq = e.user_id;
	jindi_list = await Read_jindiName();
	let supermarket_data = {
		user_id: usr_qq,
		Exchange_list: jindi_list,
	};
	const data1 = await new Show(e).get_jindiData(supermarket_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_xunbao_img(e, thing_type) {
	let xunbao_list;
	let usr_qq = e.user_id;
	xunbao_list = await Read_xunbaoName();
	let supermarket_data = {
		user_id: usr_qq,
		Exchange_list: xunbao_list,
	};
	const data1 = await new Show(e).get_xunbaoData(supermarket_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_huodon_img(e, thing_type) {
	let huodon_list;
	let usr_qq = e.user_id;
	huodon_list = await Read_huodonName();
	let supermarket_data = {
		user_id: usr_qq,
		Exchange_list: huodon_list,
	};
	const data1 = await new Show(e).get_huodonData(supermarket_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
export async  function get_xian_img(e, thing_type) {
	let xian_list;
	let usr_qq = e.user_id;
	xian_list = await Read_xianName();
	let supermarket_data = {
		user_id: usr_qq,
		Exchange_list: xian_list,
	};
	const data1 = await new Show(e).get_xianData(supermarket_data);
	let img = await puppeteer.screenshot('supermarket', {
		...data1,
	});
	return img;
}
/**
 * 地点查询
 */
export async function Goweizhi(e, weizhi, addres) {
	let adr = addres;
	let msg = ['***' + adr + '***'];
	for (let i = 0; i < weizhi.length; i++) {
		msg.push(
			weizhi[i].name +
				'\n' +
				'等级：' +
				weizhi[i].Grade +
				'\n' +
				'极品：' +
				weizhi[i].Best[0] +
				'\n' +
				'灵石：' +
				weizhi[i].Price +
				'灵石'
		);
	}
	await ForwardMsg(e, msg);
}
export async function Read_mapName() {
	let dir = path.join(`${__PATH.map}/map.json`);
	console.log(dir);
	let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	Exchange = JSON.parse(Exchange);
	return Exchange;
}
export async function Read_jindiName() {
	let dir = path.join(`${__PATH.map}/jindi.json`);
	console.log(dir);
	let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	Exchange = JSON.parse(Exchange);
	return Exchange;
}
export async function Read_xunbaoName() {
	let dir = path.join(`${__PATH.map}/xunbao.json`);
	console.log(dir);
	let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	Exchange = JSON.parse(Exchange);
	return Exchange;
}

export async function Read_xianName() {
	let dir = path.join(`${__PATH.map}/xian.json`);
	console.log(dir);
	let Exchange = fs.readFileSync(dir, 'utf8', (err, data) => {
		if (err) {
			console.log(err);
			return 'error';
		}
		return data;
	});
	//将字符串数据转变成数组格式
	Exchange = JSON.parse(Exchange);
	return Exchange;
}
export async function jindi(e, weizhi, addres) {
	let adr = addres;
	let msg = ['***' + adr + '***'];
	for (let i = 0; i < weizhi.length; i++) {
		msg.push(
			weizhi[i].name +
				'\n' +
				'等级：' +
				weizhi[i].Grade +
				'\n' +
				'极品：' +
				weizhi[i].Best[0] +
				'\n' +
				'灵石：' +
				weizhi[i].Price +
				'灵石' +
				'\n' +
				'修为：' +
				weizhi[i].experience +
				'修为'
		);
	}
	await ForwardMsg(e, msg);
}

/**
 * 常用查询合集
 */
export async function Go(e) {
	let usr_qq = e.user_id;
	//不开放私聊
	if (!e.isGroup) {
		return;
	}
	//有无存档
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
	let player = await Read_player(usr_qq);
	if (player.当前血量 < 200) {
		if (await exist_najie_thing(usr_qq, '起死回生丹', '丹药')) {
			player.当前血量 = player.血量上限;
			await Add_najie_thing(usr_qq, '起死回生丹', '丹药', -1);
			await Write_player(usr_qq, player);
			e.reply('检测到没有血量，自动消耗一颗起死回生恢复状态');
		}else{
			e.reply('你都伤成这样了,就不要出去浪了');
			return;
		}
	}
	allaction = true;
	return;
}

async function found(A) {
	let renwu = await Read_renwu();
	let i;
	for (i = 0; i < renwu.length; i++) {
		if (renwu[i].player == A) {
			break;
		}
	}
	return i;
}
