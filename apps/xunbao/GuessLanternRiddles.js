import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import fs from 'fs';
import {
	Add_najie_thing,
	isNotNull,
	ForwardMsg,
	Write_player,
	sleep,
	exist_najie_thing,
	Read_player,
	existplayer,
	foundthing,
	__PATH,
} from '../Xiuxian/xiuxian.js';

export class GuessLanternRiddles extends plugin {
	constructor() {
		super({
			/** 功能名称 */
			name: 'GuessLanternRiddles',
			/** 功能描述 */
			dsc: '猜灯谜模块',
			event: 'message',
			/** 优先级，数字越小等级越高 */
			priority: 600,
			rule: [
				{
					reg: '^#单抽(寻宝常驻祈愿|寻宝活动祈愿|附魔台)$',
					fnc: 'sk',
				},
				{
					reg: '^#十连抽(寻宝常驻祈愿|寻宝活动祈愿|附魔台)$',
					fnc: 'skten',
				},
				{
					reg: '^#百连抽寻宝常驻祈愿$',
					fnc: 'sktenPlus',
				},
				{
					reg: '^#百连抽寻宝活动祈愿$',
					fnc: 'sktenPlusPlus',
				},
				{
					reg: '^#自选存档皮肤.*$',
					fnc: 'cundan_pifu',
				},
				{
					reg: '^#种植.*$',
					fnc: 'zhongzhi',
				},
				{
					reg: '^#收获.*$',
					fnc: 'shouhuo',
				},
			],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}

	async zhongzhi(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//用户不存在
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = data.getData('player', usr_qq);
		let thing = e.msg.replace('#', '');
		thing = thing.replace('种植', '');
		let code = thing.split('*');
		let thing_name = code[0]; //物品
		// let thing_value = code[1] = 1;//数量
		let thing_exist = await foundthing(thing_name);
		if (!thing_exist) {
			e.reply(`这方世界不存在${thing_name}`);
			return;
		}
		if (thing_name == '甘蔗') {
			let ganzhe = await exist_najie_thing(usr_qq, '甘蔗', '食材');
			var Time = 60;
			let ganzhe1;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'ganzhe'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个甘蔗还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}

			ganzhe1 = await redis.get('xiuxian:player:' + usr_qq + 'ganzhe1');
			if (ganzhe1 == 0 || ganzhe1 == null) {
				if (!ganzhe) {
					e.reply('你没有甘蔗');
					return;
				}
				let gufen = await exist_najie_thing(usr_qq, '骨粉', '材料');
				if (!gufen) {
					e.reply('你没有骨粉');
					return;
				} else if (gufen < 60) {
					e.reply('你的骨粉不够，需要60个');
					return;
				}
				e.reply('你消耗了60骨粉,土地变得肥沃了，可以种植作物了');
				await Add_najie_thing(usr_qq, '骨粉', '材料', -60);
				sleep(5000);
				ganzhe1 = 1;
				await redis.set('xiuxian:player:' + usr_qq + 'ganzhe1', ganzhe1);
				await Add_najie_thing(usr_qq, '甘蔗', '食材', -1);
				e.reply('成功种下一个甘蔗,60分钟后成熟');
				await redis.set('xiuxian:player:' + usr_qq + 'ganzhe', now_Time);
				return;
			}

			ganzhe1 = 2;
			e.reply('先收获你的上一个甘蔗再种下一个吧');
			await redis.set('xiuxian:player:' + usr_qq + 'ganzhe1', ganzhe1);
			return;
		}
		if (thing_name == '金银花') {
			let jinyinhua = await exist_najie_thing(usr_qq, '金银花种子', '食材');
			var Time = 60;
			let jinyinhua1;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'jinyinhua'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个金银花还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}

			jinyinhua1 = await redis.get('xiuxian:player:' + usr_qq + 'jinyinhua1');
			if (jinyinhua1 == 0 || jinyinhua1 == null) {
				if (!jinyinhua) {
					e.reply('你没有金银花种子');
					return;
				}
				let gufen = await exist_najie_thing(usr_qq, '金克拉', '道具');
				if (!gufen) {
					e.reply('你没有金克拉');
					return;
				}
				e.reply('你消耗了一袋金克拉,土地变得肥沃了，可以种植作物了');
				await Add_najie_thing(usr_qq, '金克拉', '道具', -1);
				sleep(5000);
				jinyinhua1 = 1;
				await redis.set('xiuxian:player:' + usr_qq + 'jinyinhua1', jinyinhua1);
				await Add_najie_thing(usr_qq, '金银花种子', '食材', -1);
				e.reply('成功种下一个金银花种子,60分钟后成熟');
				await redis.set('xiuxian:player:' + usr_qq + 'jinyinhua', now_Time);
				return;
			}

			jinyinhua1 = 2;
			e.reply('先收获你的上一个金银花再种下一个吧');
			await redis.set('xiuxian:player:' + usr_qq + 'jinyinhua1', jinyinhua1);
			return;
		}
		if (thing_name == '树苗') {
			let shumiao = await exist_najie_thing(usr_qq, '树苗', '食材');
			var Time = 60;
			let sapling;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'shumiao'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个树苗还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}
			sapling = await redis.get('xiuxian:player:' + usr_qq + 'sapling');
			if (sapling == 0 || sapling == null) {
				if (!shumiao) {
					e.reply('你没有树苗');
					return;
				}
				let gufen = await exist_najie_thing(usr_qq, '骨粉', '材料');
				if (!gufen) {
					e.reply('你没有骨粉');
					return;
				} else if (gufen < 60) {
					e.reply('你的骨粉不够，需要60个');
					return;
				}
				e.reply('你消耗了60骨粉,土地变得肥沃了，可以种植作物了');
				await Add_najie_thing(usr_qq, '骨粉', '材料', -60);
				sleep(5000);
				sapling = 1;
				await redis.set('xiuxian:player:' + usr_qq + 'sapling', sapling);
				await Add_najie_thing(usr_qq, '树苗', '食材', -1);
				e.reply('成功种下一个树苗,60分钟后成熟');
				await redis.set('xiuxian:player:' + usr_qq + 'shumiao', now_Time);
				return;
			}
			sapling = 2;
			e.reply('先收获你的上一个树苗再种下一个吧');
			await redis.set('xiuxian:player:' + usr_qq + 'sapling', sapling);
			return;
		}
	}

	async shouhuo(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//用户不存在
		let ifexistplay = data.existData('player', usr_qq);
		if (!ifexistplay) {
			return;
		}
		let player = data.getData('player', usr_qq);
		let thing = e.msg.replace('#', '');
		thing = thing.replace('收获', '');
		let code = thing.split('*');
		let thing_name = code[0]; //物品
		// let thing_value = code[1] = 1;//数量
		let thing_exist = await foundthing(thing_name);
		if (!thing_exist) {
			e.reply(`这方世界不存在${thing_name}`);
			return;
		}
		if (thing_name == '甘蔗') {
			var Time = 60;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'ganzhe'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个甘蔗还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}
			let ganzhe1check = await redis.get('xiuxian:player:' + usr_qq + 'ganzhe1');
			if(ganzhe1check == 1){
				ganzhe1check = 2;
				await redis.set('xiuxian:player:' + usr_qq + 'ganzhe1', ganzhe1check);
			}
			let ganzhe1 = await redis.get('xiuxian:player:' + usr_qq + 'ganzhe1');
			if (ganzhe1 == 0) {
				e.reply('你没有种甘蔗');
				return;
			} else if (ganzhe1 == 1) {
				e.reply('你的甘蔗还没成熟');
				return;
			} else if (ganzhe1 == 2) {
				e.reply('收获成功,你获得了10个甘蔗');
				ganzhe1 = 0;
				await redis.set('xiuxian:player:' + usr_qq + 'ganzhe1', ganzhe1);
				await Add_najie_thing(usr_qq, '甘蔗', '食材', 10);
				return;
			}
		}
		if (thing_name == '金银花') {
			var Time = 60;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'jinyinhua'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个金银花还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}
			let jinyinhua1Check = await redis.get('xiuxian:player:' + usr_qq + 'jinyinhua1');
			if(jinyinhua1Check == 1){
				jinyinhua1Check = 2;
				await redis.set('xiuxian:player:' + usr_qq + 'jinyinhua1', jinyinhua1Check);
			}
			let jinyinhua1 = await redis.get('xiuxian:player:' + usr_qq + 'jinyinhua1');
			if (jinyinhua1 == 0) {
				e.reply('你没有种金银花');
				return;
			} else if (jinyinhua1 == 1) {
				e.reply('你的金银花还没成熟');
				return;
			} else if (jinyinhua1 == 2) {
				e.reply('收获成功,你获得了3个金银花');
				jinyinhua1 = 0;
				await redis.set('xiuxian:player:' + usr_qq + 'jinyinhua1', jinyinhua1);
				await Add_najie_thing(usr_qq, '金银花', '食材', 3);
				return;
			}
		}
		if (thing_name == '树苗') {
			var Time = 60;
			let now_Time = new Date().getTime(); //获取当前时间戳
			let shuangxiuTimeout = parseInt(60000 * Time);
			let last_time = await redis.get('xiuxian:player:' + usr_qq + 'shumiao'); //获得上次的时间戳,
			last_time = parseInt(last_time);
			if (now_Time < last_time + shuangxiuTimeout) {
				let Couple_m = Math.trunc(
					(last_time + shuangxiuTimeout - now_Time) / 60 / 1000
				);
				let Couple_s = Math.trunc(
					((last_time + shuangxiuTimeout - now_Time) % 60000) / 1000
				);
				e.reply('上一个树苗还没成熟' + `剩余时间:  ${Couple_m}分 ${Couple_s}秒`);
				return;
			}
			let saplingCheck = await redis.get('xiuxian:player:' + usr_qq + 'sapling');
			if(saplingCheck == 1){
				saplingCheck = 2;
				await redis.set('xiuxian:player:' + usr_qq + 'sapling', saplingCheck);
			}
			let sapling = await redis.get('xiuxian:player:' + usr_qq + 'sapling');
			if (sapling == 0) {
				e.reply('你没有种树苗');
				return;
			} else if (sapling == 1) {
				e.reply('你的树苗还没成熟');
				return;
			} else if (sapling == 2) {
				e.reply('收获成功,你获得了3个树苗');
				sapling = 0;
				await redis.set('xiuxian:player:' + usr_qq + 'sapling', sapling);
				await Add_najie_thing(usr_qq, '树苗', '食材', 3);
				return;
			}
		}
	}

	//换肤
	async cundan_pifu(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		var didian = e.msg.replace('#自选存档皮肤', '');
		//命令判断
		let code = didian.split('*');
		//数量判断
		didian = code[0];
		let type = code[1];
		let x = await exist_najie_thing(usr_qq, '虚无影子', '道具');
		if (!x) {
			e.reply('你没有【虚无影子】');
			return;
		}
		if (!isNotNull(type)) {
			e.reply('未输入类型');
		}
		didian = didian.trim();
		let photo = 999;
		let File = fs.readdirSync(__PATH.player_pifu_path);
		File = File.filter((file) => file.endsWith('.jpg'));
		let File_length1 = File.length;
		for (var k = 0; k < File_length1; k++) {
			if (didian == File[k].replace('.jpg', '')) {
				photo = didian;
				break;
			}
		}
		File = fs.readdirSync(__PATH.equipment_pifu_path);
		File = File.filter((file) => file.endsWith('.jpg'));
		let File_length2 = File.length;
		for (var k = 0; k < File_length2; k++) {
			if (didian == File[k].replace('.jpg', '')) {
				photo = didian;
				break;
			}
		}
		if (photo == 999) {
			if (type == '练气') {
				e.reply('该图片id不存在,范围[0-' + File_length1 + ']');
				return;
			}
			if (type == '装备') {
				e.reply('该图片id不存在,范围[0-' + File_length2 + ']');
				return;
			}
			e.reply('你输入的类型不正确,例#自选存档皮肤2*练气(或装备)');
			return;
		} else {
			let kamian = '';
			if (type == '练气') {
				kamian = data.daoju_list.find(
					(item) => item.id == photo && item.type == '练气影子卡面'
				);
			}
			if (type == '装备') {
				kamian = data.daoju_list.find(
					(item) => item.id == photo && item.type == '装备影子卡面'
				);
			}
			let player = await Read_player(usr_qq);
			player.练气皮肤 = kamian.id;
			await Write_player(usr_qq, player);
			await Add_najie_thing(usr_qq, kamian.name, '道具', 1);
			await Add_najie_thing(usr_qq, '虚无影子', '道具', -1);
			e.reply('兑换' + kamian.name + '成功');
		}
		return;
	}
		async sktenPlus(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		//判断是否为匿名创建存档
		if (usr_qq == 80000000) {
			return;
		}
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
				let x = await exist_najie_thing(usr_qq, '泥土', '材料');
							if (!x) {
				e.reply('你没有【泥土】');
				return;
			}
			if (x < 100) {
				e.reply('你没有足够的【泥土】');
				return;
			}
			let number = await exist_najie_thing(usr_qq, '泥土百连券', '道具');
				if (isNotNull(number) && number >= 1) {
				await Add_najie_thing(usr_qq, '泥土百连券', '道具', -1);
			} else {
				e.reply('你没有足够数量的"泥土百连券"');
				return;
			}
			e.reply('百道金光从天而降');
			let msg = [];
			let all = [];
			await sleep(5000);
			for (var i = 0; 100 > i; i++) {
				let tianluoRandom = Math.floor(Math.random() * data.changzhu.length);

				msg.push(
					'一道金光掉落在地上，走近一看是【' + data.changzhu[tianluoRandom].name + '】'
				);
				await Add_najie_thing(
					usr_qq,
					data.changzhu[tianluoRandom].name,
					data.changzhu[tianluoRandom].class,
					1
				);
				all.push('【' + data.changzhu[tianluoRandom].name + '】');
			}
			await Add_najie_thing(usr_qq, '泥土', '材料', -100);
			//await ForwardMsg(e, msg);
			e.reply('恭喜获得\n' + all);
		}
	async sktenPlusPlus(e) {
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		//判断是否为匿名创建存档
		if (usr_qq == 80000000) {
			return;
		}
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let x = await exist_najie_thing(usr_qq, '树苗', '食材');
		if (!x) {
			e.reply('你没有【树苗】');
			return;
		}
		if (x < 100) {
			e.reply('你没有足够的【树苗】');
			return;
		}
		e.reply('百道金光从天而降');
		let msg = [];
		let all = [];
		await sleep(5000);
		for (var i = 0; 100 > i; i++) {
			let tianluoRandom = Math.floor(Math.random() * data.xianding.length);

			msg.push(
				'一道金光掉落在地上，走近一看是【' + data.xianding[tianluoRandom].name + '】'
			);
			await Add_najie_thing(
				usr_qq,
				data.xianding[tianluoRandom].name,
				data.xianding[tianluoRandom].class,
				1
			);
			all.push('【' + data.xianding[tianluoRandom].name + '】');
		}
		await Add_najie_thing(usr_qq, '树苗', '食材', -100);
		//await ForwardMsg(e, msg);
		e.reply('恭喜获得\n' + all);
	}
	async skten(e) {
		if (!e.isGroup) {
			return;
		}
		//固定写法
		let usr_qq = e.user_id;
		let player = await Read_player(usr_qq);
		//判断是否为匿名创建存档
		if (usr_qq == 80000000) {
			return;
		}
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let thing = e.msg.replace('#', '');
		thing = thing.replace('十连抽', '');
		if (thing == '寻宝常驻祈愿') {
			let x = await exist_najie_thing(usr_qq, '泥土', '材料');
			if (!x) {
				e.reply('你没有【泥土】');
				return;
			}
			if (x < 10) {
				e.reply('你没有足够的【泥土】');
				return;
			}
			e.reply('十道金光从天而降');
			let msg = [];
			let all = [];
			await sleep(5000);
			for (var i = 0; 10 > i; i++) {
				let tianluoRandom = Math.floor(Math.random() * data.changzhu.length);

				msg.push(
					'一道金光掉落在地上，走近一看是【' + data.changzhu[tianluoRandom].name + '】'
				);
				await Add_najie_thing(
					usr_qq,
					data.changzhu[tianluoRandom].name,
					data.changzhu[tianluoRandom].class,
					1
				);
				all.push('【' + data.changzhu[tianluoRandom].name + '】');
			}
			await Add_najie_thing(usr_qq, '泥土', '材料', -10);
			//await ForwardMsg(e, msg);
			e.reply('恭喜获得\n' + all);
		}
		if (thing == '寻宝活动祈愿') {
			let x = await exist_najie_thing(usr_qq, '树苗', '食材');
			if (!x) {
				e.reply('你没有【树苗】');
				return;
			}
			if (x < 10) {
				e.reply('你没有足够的【树苗】');
				return;
			}
			e.reply('十道金光从天而降');
			let msg = [];
			let all = [];
			await sleep(5000);
			for (var i = 0; 10 > i; i++) {
				let tianluoRandom = Math.floor(Math.random() * data.xianding.length);

				msg.push(
					'一道金光掉落在地上，走近一看是【' + data.xianding[tianluoRandom].name + '】'
				);
				await Add_najie_thing(
					usr_qq,
					data.xianding[tianluoRandom].name,
					data.xianding[tianluoRandom].class,
					1
				);
				all.push('【' + data.xianding[tianluoRandom].name + '】');
			}
			await Add_najie_thing(usr_qq, '树苗', '食材', -10);
			//await ForwardMsg(e, msg);
			e.reply('恭喜获得\n' + all);
		}
		if (thing == '附魔台') {
			if (player.附魔台 != 1) {
				e.reply('你没有附魔台');
				return;
			}
			if (player.书架 < 50) {
				let x = await exist_najie_thing(usr_qq, '青金石', '材料');
				if (!x) {
					e.reply('你没有【青金石】');
					return;
				}
				if (x < 10) {
					e.reply('你没有足够的【青金石】');
					return;
				}
				let y = await exist_najie_thing(usr_qq, '书本', '材料');
				if (!y) {
					e.reply('你没有【书本】');
					return;
				}
				if (y < 30) {
					e.reply('你没有足够的【书本】');
					return;
				}
				e.reply('十道金光从天而降');
				await Add_najie_thing(usr_qq, '青金石', '材料', -10);
				await Add_najie_thing(usr_qq, '书本', '材料', -30);
				let msg = [];
				let all = [];
				await sleep(5000);
				for (var i = 0; 10 > i; i++) {
					let tianluoRandom = Math.floor(
						Math.random() * data.changzhufumoshu_list.length
					);
					tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
					msg.push(
						'一道金光掉落在地上，走近一看是【' +
							data.changzhufumoshu_list[tianluoRandom].name +
							'】'
					);
					await Add_najie_thing(
						usr_qq,
						data.changzhufumoshu_list[tianluoRandom].name,
						data.changzhufumoshu_list[tianluoRandom].class,
						1
					);
					all.push('【' + data.changzhufumoshu_list[tianluoRandom].name + '】');
				}
				//await ForwardMsg(e, msg);
				e.reply('恭喜获得\n' + all);
			} else {
				let x = await exist_najie_thing(usr_qq, '青金石', '材料');
				if (!x) {
					e.reply('你没有【青金石】');
					return;
				}
				if (x < 30) {
					e.reply('你没有足够的【青金石】');
					return;
				}
				let y = await exist_najie_thing(usr_qq, '书本', '材料');
				if (!y) {
					e.reply('你没有【书本】');
					return;
				}
				if (y < 10) {
					e.reply('你没有足够的【书本】');
					return;
				}
				e.reply('十道金光从天而降');
				await Add_najie_thing(usr_qq, '青金石', '材料', -30);
				await Add_najie_thing(usr_qq, '书本', '材料', -10);
				let msg = [];
				let all = [];
				await sleep(5000);
				for (var i = 0; 10 > i; i++) {
					let tianluoRandom = Math.floor(
						Math.random() * data.changzhufumoshu_list.length
					);

					msg.push(
						'一道金光掉落在地上，走近一看是【' +
							data.changzhufumoshu_list[tianluoRandom].name +
							'】'
					);
					await Add_najie_thing(
						usr_qq,
						data.changzhufumoshu_list[tianluoRandom].name,
						data.changzhufumoshu_list[tianluoRandom].class,
						1
					);
					all.push('【' + data.changzhufumoshu_list[tianluoRandom].name + '】');
				}
				//await ForwardMsg(e, msg);
				e.reply('恭喜获得\n' + all);
			}
		}
	}

	async sk(e) {
		if (!e.isGroup) {
			return;
		}
		//固定写法
		let usr_qq = e.user_id;
		//判断是否为匿名创建存档
		if (usr_qq == 80000000) {
			return;
		}
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let thing = e.msg.replace('#', '');
		thing = thing.replace('单抽', '');
		if (thing == '寻宝常驻祈愿') {
			let x = await exist_najie_thing(usr_qq, '泥土', '材料');
			if (!x) {
				e.reply('你没有【泥土】');
				return;
			}
			e.reply('一道金光从天而降');
			let tianluoRandom = Math.floor(Math.random() * data.changzhu.length);
			await Add_najie_thing(
				usr_qq,
				data.changzhu[tianluoRandom].name,
				data.changzhu[tianluoRandom].class,
				1
			);
			await Add_najie_thing(usr_qq, '泥土', '材料', -1);
			await sleep(5000);
			e.reply(
				'一道金光掉落在地上，走近一看是【' + data.changzhu[tianluoRandom].name + '】'
			);
		}
		if (thing == '寻宝活动祈愿') {
			let x = await exist_najie_thing(usr_qq, '树苗', '食材');
			if (!x) {
				e.reply('你没有【树苗】');
				return;
			}
			e.reply('一道金光从天而降');
			let tianluoRandom = Math.floor(Math.random() * data.xianding.length);
			await Add_najie_thing(
				usr_qq,
				data.xianding[tianluoRandom].name,
				data.xianding[tianluoRandom].class,
				1
			);
			await Add_najie_thing(usr_qq, '树苗', '食材', -1);
			await sleep(5000);
			e.reply(
				'一道金光掉落在地上，走近一看是【' + data.xianding[tianluoRandom].name + '】'
			);
		}
		if (thing == '附魔台') {
			let player = await Read_player(usr_qq);
			if (player.附魔台 != 1) {
				e.reply('你没有附魔台');
				return;
			}
			if (player.书架 < 50) {
				let x = await exist_najie_thing(usr_qq, '青金石', '材料');
				if (!x) {
					e.reply('你没有【青金石】');
					return;
				}
				let y = await exist_najie_thing(usr_qq, '书本', '材料');
				if (!y) {
					e.reply('你没有【书本】');
					return;
				}
				await Add_najie_thing(usr_qq, '书本', '材料', -3);
				await Add_najie_thing(usr_qq, '青金石', '材料', -3);
				let tianluoRandom = Math.floor(
					Math.random() * data.changzhufumoshu_list.length
				);
				tianluoRandom = (Math.ceil((tianluoRandom + 1) / 5) - 1) * 5;
				console.log(tianluoRandom);
				e.reply('附魔书亮起来了');
				await sleep(5000);
				e.reply(
					`金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`
				);
				await sleep(1000);
				await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name,data.changzhufumoshu_list[tianluoRandom].class, 1)
				e.reply('恭喜获得' + data.changzhufumoshu_list[tianluoRandom].name);
				return;
			} else {
				let x = await exist_najie_thing(usr_qq, '青金石', '材料');
				if (!x) {
					e.reply('你没有【青金石】');
					return;
				}
				if (x < 3) {
					e.reply('你没有足够的【青金石】');
					return;
				}
				let y = await exist_najie_thing(usr_qq, '书本', '材料');
				if (!y) {
					e.reply('你没有【书本】');
					return;
				}
				await Add_najie_thing(usr_qq, '书本', '材料', -1);
				await Add_najie_thing(usr_qq, '青金石', '材料', -1);
				let tianluoRandom = Math.floor(
					Math.random() * data.changzhufumoshu_list.length
				);
				console.log(tianluoRandom);
				e.reply('附魔书亮起来了');
				await sleep(5000);
				e.reply(
					`金光掉落在地上，走近一看是 ${data.changzhufumoshu_list[tianluoRandom].name}`
				);
				await sleep(1000);
				 await Add_najie_thing(usr_qq, data.changzhufumoshu_list[tianluoRandom].name,data.changzhufumoshu_list[tianluoRandom].class, 1)
				e.reply('恭喜获得' + data.changzhufumoshu_list[tianluoRandom].name);
				return;
			}
		}
	}
}
/**
 * 状态
 */
export async function Go(e) {
	let usr_qq = e.user_id;
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
	allaction = true;
	return;
}
