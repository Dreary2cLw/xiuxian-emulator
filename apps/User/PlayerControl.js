import plugin from '../../../../lib/plugins/plugin.js';
import common from '../../../../lib/common/common.js';
import config from '../../model/Config.js';
import data from '../../model/XiuxianData.js';
import {
	Add_najie_thing,
	Add_修为,
	Add_血气,
	exist_najie_thing,
	existplayer,
	isNotNull,
	player_efficiency,
	Read_player,
} from '../Xiuxian/xiuxian.js';

/**
 * 定时任务
 */

export class PlayerControl extends plugin {
	constructor() {
		super({
			name: 'PlayerControl',
			dsc: '控制人物的行为',
			event: 'message',
			priority: 600,
			rule: [
				{
					reg: '(^#*降妖$)|(^#*降妖(.*)(分|分钟)$)',
					fnc: 'Dagong',
				},
				{
					reg: '(^#闭关$)|(^#闭关(.*)(分|分钟)$)',
					fnc: 'Biguan',
				},
				{
					reg: '^#出关$',
					fnc: 'chuGuan',
				},
				{
					reg: '^#降妖归来$',
					fnc: 'endWork',
				},
			],
		});
		this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
	}

	//闭关
	async Biguan(e) {
		let usr_qq = e.user_id; //用户qq
		//有无存档
		if (!(await existplayer(usr_qq))) {
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

		//获取时间
		let time = e.msg.replace('#', '');
		time = time.replace('闭关', '');
		time = time.replace('分', '');
		time = time.replace('钟', '');
		if (parseInt(time) == parseInt(time)) {
			time = parseInt(time);
			let y = 30; //时间
			let x = 240; //循环次数
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			//如果<30，修正。
			if (time < 30) {
				time = 30;
			}
		} else {
			//不设置时间默认60分钟
			time = 30;
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
		console.log("测试1");

		let action_time = time * 60 * 1000; //持续时间，单位毫秒
		let arr = {
			action: '闭关', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '0', //闭关状态-开启
			working: '1', //降妖状态-关闭
			Place_action: '1', //秘境状态---关闭
			Place_actionplus: '1', //沉迷---关闭
			mojie: '1', //魔界状态---关闭
			power_up: '1', //渡劫状态--关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		console.log("测试"+JSON.stringify(arr));
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr)); //redis设置动作
		e.reply(`现在开始闭关${time}分钟,两耳不闻窗外事了`);

		return true;
	}

	//降妖
	async Dagong(e) {
		//不开放私聊
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id; //用户qq
		//有无存档
		if (!(await existplayer(usr_qq))) {
			return;
		}
		//获取游戏状态
		let game_action = await redis.get('xiuxian:player:' + usr_qq + ':game_action');
		//防止继续其他娱乐行为
		if (game_action == 0) {
			e.reply('修仙：游戏进行中...');
			return;
		}
		//获取时间
		let time = e.msg.replace('#', '');
		time = time.replace('降妖', '');
		time = time.replace('分', '');
		time = time.replace('钟', '');
		if (parseInt(time) == parseInt(time)) {
			time = parseInt(time); //你选择的时间
			let y = 15; //固定时间
			let x = 48; //循环次数
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			//如果<30，修正。
			if (time < 15) {
				time = 15;
			}
		} else {
			//不设置时间默认60分钟
			time = 30;
		}

		let player = await Read_player(usr_qq);
		if (player.当前血量 < 200) {
			e.reply('你都伤成这样了,先去疗伤吧');
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
		let action_time = time * 60 * 1000; //持续时间，单位毫秒
		let arr = {
			action: '降妖', //动作
			end_time: new Date().getTime() + action_time, //结束时间
			time: action_time, //持续时间
			shutup: '1', //闭关状态-关闭
			working: '0', //降妖状态-开启
			Place_action: '1', //秘境状态---关闭
			Place_actionplus: '1', //沉迷---关闭
			mojie: '1', //魔界状态---关闭
			power_up: '1', //渡劫状态--关闭
			xijie: '1', //洗劫状态开启
			plant: '1', //采药-开启
			mine: '1', //采矿-开启
		};
		if (e.isGroup) {
			arr.group_id = e.group_id;
		}
		await redis.set('xiuxian:player:' + usr_qq + ':action', JSON.stringify(arr)); //redis设置动作
		e.reply(`现在开始降妖${time}分钟`);
		return true;
	}
/*
	/**
	 * 人物结束闭关
	 * @param e
	 * @returns {Promise<void>}
	 */
/*	async chuGuan(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let action = await this.getPlayerAction(e.user_id);
		let state = await this.getPlayerState(action);
		if (state == '空闲') {
			return;
		}

		if (action.action != '闭关') {
			return;
		}
		//结算
		let end_time = action.end_time;
		let start_time = action.end_time - action.time;
		let now_time = new Date().getTime();
		let time;

		let y = this.xiuxianConfigData.biguan.time; //固定时间
		let x = this.xiuxianConfigData.biguan.cycle; //循环次数

		if (end_time > now_time) {
			//属于提前结束
			time = parseInt((new Date().getTime() - start_time) / 1000 / 60);
			//超过就按最低的算，即为满足30分钟才结算一次
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		} else {
			//属于结束了未结算
			time = parseInt(action.time / 1000 / 60);
			//超过就按最低的算，即为满足30分钟才结算一次
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		}

		if (e.isGroup) {
			await this.biguan_jiesuan(e.user_id, time, false, e.group_id); //提前闭关结束不会触发随机事件
		} else {
			await this.biguan_jiesuan(e.user_id, time, false); //提前闭关结束不会触发随机事件
		}

		let arr = action;
		//把状态都关了
		arr.shutup = 1; //闭关状态
		arr.working = 1; //降妖状态
		arr.power_up = 1; //渡劫状态
		arr.Place_action = 1; //秘境
		arr.end_time = new Date().getTime(); //结束的时间也修改为当前时间
		delete arr.group_id; //结算完去除group_id
		await redis.set('xiuxian:player:' + e.user_id + ':action', JSON.stringify(arr));
	}
*/
/*
/**
 * 处理人物结束闭关
 * @param e 事件对象
 * @returns {Promise<void>}
 */
/*async chuGuan(e) {
	// 如果不是群聊，返回不做处理
	if (!e.isGroup) {
		return;
	}

	// 锁的标识符
	const lockKey = `xiuxian:player:${e.user_id}:lock`;

	// 尝试获取锁
	const lockAcquired = await redis.set(lockKey, 'locked', 'NX', 'PX', 60000); // 锁定 60 秒

	if (!lockAcquired) {
		// 如果锁未获取成功，说明正在处理中，直接返回
		return;
	}

	try {
		// 获取玩家的当前动作
		let action = await this.getPlayerAction(e.user_id);

		// 获取玩家的状态
		let state = await this.getPlayerState(action);

		// 如果玩家状态是空闲，不进行任何处理
		if (state == '空闲') {
			return;
		}

		// 如果当前动作不是闭关，也不进行处理
		if (action.action != '闭关') {
			return;
		}

		// 计算闭关的结束时间和开始时间
		let end_time = action.end_time;
		let start_time = action.end_time - action.time;
		let now_time = new Date().getTime();
		let time;

		let y = this.xiuxianConfigData.biguan.time; // 获取配置中的固定时间
		let x = this.xiuxianConfigData.biguan.cycle; // 获取配置中的循环次数

		if (end_time > now_time) {
			// 闭关提前结束
			time = parseInt((now_time - start_time) / 1000 / 60);
			// 如果时间超过了规定的时间，就按最低时间计算
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		} else {
			// 闭关正常结束但未结算
			time = parseInt(action.time / 1000 / 60);
			// 如果时间超过了规定的时间，就按最低时间计算
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		}

		// 结算闭关结果
		if (e.isGroup) {
			await this.biguan_jiesuan(e.user_id, time, false, e.group_id); // 提前闭关结束不会触发随机事件
		} else {
			await this.biguan_jiesuan(e.user_id, time, false); // 提前闭关结束不会触发随机事件
		}

		let arr = action;
		// 将状态标记为已关闭
		arr.shutup = 1; // 闭关状态
		arr.working = 1; // 降妖状态
		arr.power_up = 1; // 渡劫状态
		arr.Place_action = 1; // 秘境
		arr.end_time = new Date().getTime(); // 更新结束时间为当前时间
		delete arr.group_id; // 结算完后去除 group_id
		await redis.set('xiuxian:player:' + e.user_id + ':action', JSON.stringify(arr)); // 更新玩家动作状态到 Redis

	} finally {
		// 释放锁
		await redis.del(lockKey);
	}
}
	*/

/**
 * 处理人物结束闭关
 * @param e 事件对象
 * @returns {Promise<void>}
 */
async chuGuan(e) {

	let cooldown = await redis.get('xiuxian:cooldown:' + e.user_id);
    if (cooldown && parseInt(cooldown) > new Date().getTime()) {
        e.reply('别卡了,再卡bug给你打入地牢');
        return;
    }
    let cooldownTime = 30 * 1000; // 30秒
    await redis.set('xiuxian:cooldown:' + e.user_id, new Date().getTime() + cooldownTime);

	// 如果不是群聊，返回不做处理
	if (!e.isGroup) {
		return;
	}

	// 锁的标识符
	const lockKey = `xiuxian:player:${e.user_id}:lock`;

	// 尝试获取锁
	const lockAcquired = await redis.set(lockKey, 'locked', 'NX', 'PX', 60000); // 锁定 60 秒

	if (!lockAcquired) {
		// 如果锁未获取成功，说明正在处理中，记录日志并返回
		console.log(`玩家 ${e.user_id} 的闭关处理已在进行中，跳过此请求。`);
		return;
	}

	// 锁获取成功
	console.log(`玩家 ${e.user_id} 成功获取到锁，开始处理闭关结束。`);

	try {
		// 获取玩家的当前动作
		let action = await this.getPlayerAction(e.user_id);

		// 获取玩家的状态
		let state = await this.getPlayerState(action);

		// 如果玩家状态是空闲，不进行任何处理
		if (state == '空闲') {
			console.log(`玩家 ${e.user_id} 当前状态为空闲，无需处理闭关结束。`);
			return;
		}

		// 如果当前动作不是闭关，也不进行处理
		if (action.action != '闭关') {
			console.log(`玩家 ${e.user_id} 当前动作不是闭关，无需处理闭关结束。`);
			return;
		}

		// 计算闭关的结束时间和开始时间
		let end_time = action.end_time;
		let start_time = action.end_time - action.time;
		let now_time = new Date().getTime();
		let time;

		let y = this.xiuxianConfigData.biguan.time; // 获取配置中的固定时间
		let x = this.xiuxianConfigData.biguan.cycle; // 获取配置中的循环次数

		if (end_time > now_time) {
			// 闭关提前结束
			time = parseInt((now_time - start_time) / 1000 / 60);
			// 如果时间超过了规定的时间，就按最低时间计算
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		} else {
			// 闭关正常结束但未结算
			time = parseInt(action.time / 1000 / 60);
			// 如果时间超过了规定的时间，就按最低时间计算
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			if (time < y) {
				time = 0;
			}
		}

		// 结算闭关结果
		if (e.isGroup) {
			await this.biguan_jiesuan(e.user_id, time, false, e.group_id); // 提前闭关结束不会触发随机事件
		} else {
			await this.biguan_jiesuan(e.user_id, time, false); // 提前闭关结束不会触发随机事件
		}

		let arr = action;
		// 将状态标记为已关闭
		arr.shutup = 1; // 闭关状态
		arr.working = 1; // 降妖状态
		arr.power_up = 1; // 渡劫状态
		arr.Place_action = 1; // 秘境
		arr.end_time = new Date().getTime(); // 更新结束时间为当前时间
		delete arr.group_id; // 结算完后去除 group_id
		await redis.set('xiuxian:player:' + e.user_id + ':action', JSON.stringify(arr)); // 更新玩家动作状态到 Redis

		console.log(`玩家 ${e.user_id} 的闭关处理完成，状态已更新。`);

	} finally {
		// 释放锁
		await redis.del(lockKey);
		console.log(`玩家 ${e.user_id} 的锁已释放。`);
	}
}

	/**
	 * 人物结束降妖
	 * @param e
	 * @returns {Promise<void>}
	 */
	async endWork(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let action = await this.getPlayerAction(e.user_id);
		let state = await this.getPlayerState(action);
		if (state == '空闲') {
			return;
		}
		if (action.action != '降妖') {
			return;
		}
		//结算
		let end_time = action.end_time;
		let start_time = action.end_time - action.time;
		let now_time = new Date().getTime();
		let time;
		let y = this.xiuxianConfigData.work.time; //固定时间
		let x = this.xiuxianConfigData.work.cycle; //循环次数

		if (end_time > now_time) {
			//属于提前结束
			time = parseInt((new Date().getTime() - start_time) / 1000 / 60);
			//超过就按最低的算，即为满足30分钟才结算一次
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			//如果<15，不给收益
			if (time < y) {
				time = 0;
			}
		} else {
			//属于结束了未结算
			time = parseInt(action.time / 1000 / 60);
			//超过就按最低的算，即为满足30分钟才结算一次
			//如果是 >=16*33 ----   >=30
			for (let i = x; i > 0; i--) {
				if (time >= y * i) {
					time = y * i;
					break;
				}
			}
			//如果<15，不给收益
			if (time < y) {
				time = 0;
			}
		}

		if (e.isGroup) {
			await this.dagong_jiesuan(e.user_id, time, false, e.group_id); //提前闭关结束不会触发随机事件
		} else {
			await this.dagong_jiesuan(e.user_id, time, false); //提前闭关结束不会触发随机事件
		}

		let arr = action;
		arr.is_jiesuan = 1; //结算状态
		arr.shutup = 1; //闭关状态
		arr.working = 1; //降妖状态
		arr.power_up = 1; //渡劫状态
		arr.Place_action = 1; //秘境
		//结束的时间也修改为当前时间
		arr.end_time = new Date().getTime();
		delete arr.group_id; //结算完去除group_id
		await redis.set('xiuxian:player:' + e.user_id + ':action', JSON.stringify(arr));
	}

	/**
	 * 闭关结算
	 * @param usr_qq
	 * @param time持续时间(单位用分钟)
	 * @param is_random是否触发随机事件  true,false
	 * @param group_id  回复消息的地址，如果为空，则私聊
	 * @returns {Promise<void>}
	 */
	async biguan_jiesuan(user_id, time, is_random, group_id) {
		let usr_qq = user_id;
		
		await player_efficiency(usr_qq);
		let player = data.getData('player', usr_qq);
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		//闭关收益倍率计算 倍率*境界id*天赋*时间
		let size = this.xiuxianConfigData.biguan.size;
		//增加的修为
		let xiuwei = parseInt(size * now_level_id * (player.修炼效率提升 + 1));
		//恢复的血量
		let blood = parseInt(player.血量上限 * 0.02);
		//额外修为
		let other_xiuwei = 0;

		let msg = [segment.at(usr_qq)];
		//炼丹师丹药修正
		let transformation = '修为';
		let xueqi = 0;
		let action3 = await redis.get('xiuxian:player:' + 10 + ':biguang'); //数据放在redis里
		
		action3 = await JSON.parse(action3);
		for (let i = 0; i < action3.length; i++) {
			//console.log('推送：' + JSON.stringify(action3));
			if (action3[i].qq == usr_qq) {
				if (action3[i].biguan > 0) {
					action3[i].biguan--;
					if (action3[i].biguan == 0) {
						action3[i].biguanxl = 0;
					}
				}
				if (action3[i].lianti > 0) {
					transformation = '血气';
					action3[i].lianti--;
				}

				//随机事件预留空间
				if (is_random) {
					let rand = Math.random();
					//顿悟
					if (rand < 0.2) {
						rand = Math.trunc(rand * 10) + 45;
						other_xiuwei = rand * time;
						xueqi = Math.trunc(rand * time * action3[i].beiyong4);
						if (transformation == '血气') {
							msg.push('\n本次闭关顿悟,受到炼神之力修正,额外增加血气:' + xueqi);
						} else {
							msg.push('\n本次闭关顿悟,额外增加修为:' + rand * time);
						}
					}
					//走火入魔
					else if (rand > 0.8) {
						rand = Math.trunc(rand * 10) + 5;
						other_xiuwei = -1 * rand * time;
						xueqi = Math.trunc(rand * time * action3[i].beiyong4);
						if (transformation == '血气') {
							msg.push(
								'\n,由于你闭关时隔壁装修,导致你差点走火入魔,受到炼神之力修正,血气下降' + xueqi
							);
						} else {
							msg.push('\n由于你闭关时隔壁装修,导致你差点走火入魔,修为下降' + rand * time);
						}
					}
				}
				let other_x = 0;
				let qixue = 0;
				if (
					(await exist_najie_thing(usr_qq, '魔界秘宝', '道具')) &&
					player.魔道值 > 999
				) {
					other_x = Math.trunc(xiuwei * 0.15 * time);
					await Add_najie_thing(usr_qq, '魔界秘宝', '道具', -1);
					msg.push('\n消耗了道具[魔界秘宝],额外增加' + other_x + '修为');
					await Add_修为(usr_qq, other_x);
				}
				if (
					(await exist_najie_thing(usr_qq, '神界秘宝', '道具')) &&
					player.魔道值 < 1 &&
					(player.灵根.type == '转生' || player.level_id > 41)
				) {
					qixue = Math.trunc(xiuwei * 0.1 * time);
					await Add_najie_thing(usr_qq, '神界秘宝', '道具', -1);
					msg.push('\n消耗了道具[神界秘宝],额外增加' + qixue + '血气');
					await Add_血气(usr_qq, qixue);
				}
				//设置修为，设置血量

				await this.setFileValue(usr_qq, blood * time, '当前血量');

				//给出消息提示
				if (transformation == '血气') {
					await this.setFileValue(
						usr_qq,
						(xiuwei * time + other_xiuwei) * action3[i].beiyong4,
						transformation
					); //丹药修正
					msg.push(
						'\n受到炼神之力的影响,增加血气:' + xiuwei * time * action3[i].beiyong4,
						'  获得治疗,血量增加:' + blood * time
					);
				} else {
					await this.setFileValue(usr_qq, xiuwei * time + other_xiuwei, transformation);
					if (is_random) {
						msg.push(
							'\n增加气血:' + xiuwei * time,
							'  获得治疗,血量增加:' + blood * time + '炼神之力消散了'
						);
					} else {
						msg.push('\n增加修为:' + xiuwei * time, '  获得治疗,血量增加:' + blood * time);
					}
				}
				try {
					if (group_id) {
						await this.pushInfo(group_id, true, msg);
					} else {
						await this.pushInfo(usr_qq, false, msg);
					}
				} catch (error) {
					logger.error('推送错误：' + error);
				}
				if (action3[i].lianti <= 0) {
					action3[i].lianti = 0;
					action3[i].beiyong4 = 0;
				}
			} //炼丹师修正结束
		}
	
		await redis.set('xiuxian:player:' + 10 + ':biguang', JSON.stringify(action3));
		return;
	}

	/**
	 * 降妖结算
	 * @param usr_qq
	 * @param time持续时间(单位用分钟)
	 * @param is_random是否触发随机事件  true,false
	 * @param group_id  回复消息的地址，如果为空，则私聊
	 * @returns {Promise<void>}
	 */
	async dagong_jiesuan(user_id, time, is_random, group_id) {
		let usr_qq = user_id;
		let player = data.getData('player', usr_qq);
		let now_level_id;
		if (!isNotNull(player.level_id)) {
			return;
		}
		now_level_id = data.Level_list.find(
			(item) => item.level_id == player.level_id
		).level_id;
		let size = this.xiuxianConfigData.work.size;
		let lingshi = size * now_level_id;
		let other_lingshi = 0; //额外的灵石
		let Time = time * 2;
		let msg = [segment.at(usr_qq)];
		if (is_random) {
			//随机事件预留空间
			let rand = Math.random();
			if (rand < 0.2) {
				rand = Math.trunc(rand * 10) + 40;
				other_lingshi = rand * Time;
				msg.push('\n本次增加灵石' + rand * Time);
			} else if (rand > 0.8) {
				rand = Math.trunc(rand * 10) + 5;
				other_lingshi = -1 * rand * Time;
				msg.push('\n由于你的疏忽,货物被人顺手牵羊,老板大发雷霆,灵石减少' + rand * Time);
			}
		}
		let get_lingshi = lingshi * Time + other_lingshi * 1.5; //最后获取到的灵石

		//设置灵石
		await this.setFileValue(usr_qq, get_lingshi, '灵石');

		//给出消息提示
		if (is_random) {
			msg.push('\n增加灵石' + get_lingshi);
		} else {
			msg.push('\n增加灵石' + get_lingshi);
		}

		try {
			if (group_id) {
				await this.pushInfo(group_id, true, msg);
			} else {
				await this.pushInfo(usr_qq, false, msg);
			}
		} catch {

		}

		return;
	}

	/**
	 * 获取缓存中的人物状态信息
	 * @param usr_qq
	 * @returns {Promise<void>}
	 */
	async getPlayerAction(usr_qq) {
		let action = await redis.get('xiuxian:player:' + usr_qq + ':action');
		action = JSON.parse(action); //转为json格式数据
		return action;
	}

	/**
	 * 获取人物的状态，返回具体的状态或者空闲
	 * @param action
	 * @returns {Promise<void>}
	 */
	async getPlayerState(action) {
		if (action == null) {
			return '空闲';
		}
		let now_time = new Date().getTime();
		let end_time = action.end_time;
		//当前时间>=结束时间，并且未结算 属于已经完成任务，却并没有结算的
		//当前时间<=完成时间，并且未结算 属于正在进行
		if (
			!(
				(now_time >= end_time &&
					(action.shutup == 0 || action.working == 0 || action.plant == 0)) ||
				(now_time <= end_time &&
					(action.shutup == 0 || action.working == 0 || action.plant == 0))
			)
		) {
			return '空闲';
		}
		return action.action;
	}

	/**
	 * 推送消息，群消息推送群，或者推送私人
	 * @param id
	 * @param is_group
	 * @returns {Promise<void>}
	 */
	async pushInfo(id, is_group, msg) {
		if (is_group) {
			await Bot.pickGroup(id)
				.sendMsg(msg)
				.catch((err) => {
					Bot.logger.mark(err);
				});
		} else {
			await common.relpyPrivate(id, msg);
		}
	}

	/**
	 * 增加player文件某属性的值（在原本的基础上增加）
	 * @param user_qq
	 * @param num 属性的value
	 * @param type 修改的属性
	 * @returns {Promise<void>}
	 */
	async setFileValue(user_qq, num, type) {
		let user_data = data.getData('player', user_qq);
		let current_num = user_data[type]; //当前灵石数量
		let new_num = current_num + num;
		if (type == '当前血量' && new_num > user_data.血量上限) {
			new_num = user_data.血量上限; //治疗血量需要判读上限
		}
		user_data[type] = new_num;
		await data.setData('player', user_qq, user_data);
		return;
	}
}
