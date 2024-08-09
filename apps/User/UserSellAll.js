//插件加载
import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import {
	Add_najie_thing,
	Add_player_学习功法,
	Add_修为,
	Add_灵石,
	Add_血气,
	Check_thing,
	exist_najie_thing,
	existplayer,
	foundthing,
	instead_equipment,
	re_najie_thing,
	Locked_najie_thing,
	Read_player,
	Write_najie,
	Read_equipment,
	isNotNull,
	Write_player,
	__PATH,
	get_log_img,
} from '../Xiuxian/xiuxian.js';
import { get_equipment_img } from '../ShowImeg/showData.js';
import { synchronization } from '../AdminSuper/AdminSuper.js';
import { Pushforum_ASS } from '../Help/Forum.js';
import { Synchronization_ASS } from '../Association/TreasureCabinet.js';
import {Read_shop, Write_shop} from "../Xijie/Xijie.js";

/**
 * 全局变量
 */
/**
 * 作者：零零零零
 * 支持一键出售物品
 * 一键服用修为丹药
 * 一键装备
 * 一键学习功法
 * 一键锁定
 * 一键解锁
 * 一键赠送
 * 锁定/解锁
 */
let allaction = false;


export const verc = ({ e }) => {
	//  const { whitecrowd, blackid } = config.getConfig('parameter', 'namelist');
	//  if (whitecrowd.indexOf(e.group_id) == -1) return false;
	//  if (blackid.indexOf(e.user_id.toString().replace('qg_','')) != -1) return false;
	  return true;
	};


export class UserSellAll extends plugin {
	constructor() {
		super({
			name: 'UserSellAll',
			dsc: '修仙模块',
			event: 'message',
			priority: 600,
			rule: [
				{
					reg: '^#一键出售(.*)$',
					fnc: 'Sell_all_comodities',
				},
				{
					reg: '^#一键服用修为丹$',
					fnc: 'all_xiuweidan',
				},
				{
					reg: '^#一键服用血气丹$',
					fnc: 'all_xueqidan',
				},
				{
					reg: '^#一键装备$',
					fnc: 'all_zhuangbei',
				},
				{
					reg: '^#一键学习$',
					fnc: 'all_learn',
				},
				{
					reg: '^#一键同步$',
					fnc: 'all_tongbu',
				},
				{
					reg: '^#召唤天道',
					fnc: 'tiandao',
				},
				{
					reg: '^#(锁定|解锁).*$',
					fnc: 'locked',
				},
				{
					reg: '^#一键赠送(装备|道具|丹药|功法|草药|材料|食材|盒子|仙宠|仙宠口粮)$',
					fnc: 'all_give',
				},
				{
					reg: '^#一键锁定(.*)$',
					fnc: 'all_locked',
				},
				{
					reg: '^#一键解锁(.*)$',
					fnc: 'all_unlocked',
				},
				{
					reg: '^#特殊同步$',
					fnc: 'sp_tongbu',
				}
			],
		});
	}
	/*by零*/
	async all_give(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		//这是自己的
		let A_qq = e.user_id;
		//自己没存档
		let ifexistplay = await existplayer(A_qq);
		if (!ifexistplay) {
			return;
		}
		//对方
		let isat = e.message.some((item) => item.type === 'at');
		if (!isat) {
			return;
		}
		let atItem = e.message.filter((item) => item.type === 'at'); //获取at信息
		let B_qq = atItem[0].qq; //对方qq
		//对方没存档
		ifexistplay = await existplayer(B_qq);
		if (!ifexistplay) {
			e.reply(`此人尚未踏入仙途`);
			return;
		}
		let A_najie = await data.getData('najie', A_qq);
		let B_najie = await data.getData('najie', B_qq);
		//命令判断
		let code = e.msg.replace('#一键赠送', '');
		let thing_class = code;
		for (let index = 0; index < A_najie[thing_class].length; index++) {
			const element = A_najie[thing_class][index];
			if (
				(await Locked_najie_thing(A_qq, element.name, element.class, element.pinji)) ==
				1
			) {
				continue;
			}
			if ((await Check_thing(element)) == 1) {
				continue;
			}
			let number = await exist_najie_thing(
				A_qq,
				element.name,
				element.class,
				element.pinji
			);
			await Add_najie_thing(
				A_qq,
				element.name,
				element.class,
				-number,
				element.pinji
			);
			await Add_najie_thing(B_qq, element.name, element.class, number, element.pinji);
		}
		e.reply(`一键赠送${thing_class}完成`);
		return;
	}

	async all_locked(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let najie = await data.getData('najie', usr_qq);
		let wupin = [
			'装备',
			'道具',
			'丹药',
			'功法',
			'草药',
			'材料',
			'食材',
			'盒子',
			'仙宠',
			'仙宠口粮',
		];
		let wupin1 = [];
		if (e.msg != '#一键锁定') {
			let thing = e.msg.replace('#一键锁定', '');
			for (var i of wupin) {
				if (thing == i) {
					wupin1.push(i);
					thing = thing.replace(i, '');
				}
			}
			if (thing.length == 0) {
				wupin = wupin1;
			} else {
				return;
			}
		}
		for (var i of wupin) {
			for (let l of najie[i]) {
				//纳戒中的数量
				l.islockd = 1;
			}
		}
		await Write_najie(usr_qq, najie);
		e.reply(`一键锁定完成`);
		return;
	}

	async all_unlocked(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		let najie = await data.getData('najie', usr_qq);
		let wupin = [
			'装备',
			'道具',
			'丹药',
			'功法',
			'草药',
			'材料',
			'食材',
			'盒子',
			'仙宠',
			'仙宠口粮',
		];
		let wupin1 = [];
		if (e.msg != '#一键解锁') {
			let thing = e.msg.replace('#一键解锁', '');
			for (var i of wupin) {
				if (thing == i) {
					wupin1.push(i);
					thing = thing.replace(i, '');
				}
			}
			if (thing.length == 0) {
				wupin = wupin1;
			} else {
				return;
			}
		}
		for (var i of wupin) {
			for (let l of najie[i]) {
				//纳戒中的数量
				l.islockd = 0;
			}
		}
		await Write_najie(usr_qq, najie);
		e.reply(`一键解锁完成`);
		return;
	}

	async locked(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//命令判断
		let msg = e.msg.replace('#', '');
		let un_lock = msg.substr(0, 2);
		let thing = msg.substr(2).split('*');
		let thing_name = thing[0];
		thing[0] = parseInt(thing[0]);
		let thing_pinji;
		let thing_exist = await foundthing(thing_name);
		if (!thing_exist) {
			e.reply(`你瓦特了吧，这方世界没有这样的东西:${thing_name}`);
			return;
		}
		let pj = {
			劣: 0,
			普: 1,
			优: 2,
			精: 3,
			极: 4,
			绝: 5,
			顶: 6,
		};
		thing_pinji = pj[thing[1]];
		let ifexist;
		if (un_lock == '锁定') {
			ifexist = await re_najie_thing(
				usr_qq,
				thing_name,
				thing_exist.class,
				thing_pinji,
				1
			);
			if (ifexist) {
				e.reply(`${thing_exist.class}:${thing_name}已锁定`);
				return;
			}
		} else if (un_lock == '解锁') {
			ifexist = await re_najie_thing(
				usr_qq,
				thing_name,
				thing_exist.class,
				thing_pinji,
				0
			);
			if (ifexist) {
				e.reply(`${thing_exist.class}:${thing_name}已解锁`);
				return;
			}
		}
		e.reply(`你没有【${thing_name}】这样的${thing_exist.class}`);
		return;
	}

	async all_tongbu(e) {
		await synchronization(e);
		await Pushforum_ASS(e);
		await Synchronization_ASS(e);
	}
	async sp_tongbu(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		e.reply('洗劫状态同步开始');
		let shop = await Read_shop();
		for (let i = 0; i < shop.length; i++) {
			if (shop[i].state == 1) {
				console.log(shop[i].name);
				shop[i].state = 0;
			}
		}
		await Write_shop(shop);
		e.reply('洗劫状态同步结束');
		let player = await data.getData('player', usr_qq);
		e.reply('运气同步开始');
		//更新面板
		let equipment = await Read_equipment(usr_qq);
		if (!isNotNull(player.幸运)) {
			player.幸运 = 0;
		}
		if (!isNotNull(player.addluckyNo)) {
			player.addluckyNo = 0;
		}
		if (!isNotNull(equipment.项链)) {
			equipment.项链 = data.necklace_list.find((item) => item.name == '幸运儿');
			player.幸运 += data.necklace_list.find((item) => item.name == '幸运儿').加成;
		}
		if (equipment.项链.属性 == '幸运') {
			if (
				player.仙宠.type == '幸运' &&
				player.幸运 != player.仙宠.加成 + equipment.项链.加成 + player.addluckyNo
			) {
				player.幸运 = player.仙宠.加成 + player.addluckyNo + equipment.项链.加成;
			} else if (
				player.仙宠.type != '幸运' &&
				player.幸运 != equipment.项链.加成 + player.addluckyNo
			) {
				player.幸运 = player.addluckyNo + equipment.项链.加成;
			}
		} else {
			if (
				player.仙宠.type == '幸运' &&
				player.幸运 != player.仙宠.加成 + player.addluckyNo
			) {
				player.幸运 = player.仙宠.加成 + player.addluckyNo;
			} else if (player.仙宠.type != '幸运' && player.幸运 != player.addluckyNo) {
				player.幸运 = player.addluckyNo;
			}
		}
		await Write_player(usr_qq, player);
		e.reply('运气同步结束');
		return;
	}






























  //一键出售
  async Sell_all_comodities(e) {
	//不开放私聊功能
	if (!e.isGroup) {
		return;
	}
	let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) return false;
    let commodities_price = 0;
    let najie = await data.getData('najie', usr_qq);
    let wupin = [
      	'装备',
      	'丹药',
      	'道具',
      	'功法',
      	'草药',
		'材料',
		'盒子',
		'仙宠口粮',
		'仙宠',
		'食材',
    ];
    let wupin1 = [];
    if (e.msg != '#一键出售') {
      let thing = e.msg.replace('#一键出售', '');
      for (var i of wupin) {
        if (thing == i) {
          wupin1.push(i);
          thing = thing.replace(i, '');
        }
      }
      if (thing.length == 0) {
        wupin = wupin1;
      } else {
        return false;
      }

      for (let i of wupin) {
        for (let l of najie[i]) {
          if (l && l.islockd == 0) {

            //纳戒中的数量
            let quantity = l.数量;
            if(l.name!="秘境之匙"){
              await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
              commodities_price = commodities_price + l.出售价 * quantity;
            }else{
              await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
              commodities_price = commodities_price + 2000000 * quantity;
            }

          }
        }
      }
      await Add_灵石(usr_qq, commodities_price);
      e.reply(`出售成功!  获得${commodities_price}灵石 `)
      return false;
    }
    let goodsNum = 0;
    let goods = [];
    goods.push('正在出售:');
    for (let i of wupin) {
      for (let l of najie[i]) {
        if (l && l.islockd == 0) {
          //纳戒中的数量
          let quantity = l.数量;
          goods.push('\n' + l.name + '*' + quantity);
          goodsNum++;
        }
      }
    }
    if (goodsNum == 0) {
      e.reply('没有东西可以出售', false, { at: true });
      return false;
    }
    goods.push('\n回复[1]出售,回复[0]取消出售');
    /** 设置上下文 */
    this.setContext('noticeSellAllGoods');
    for (let i = 0; i < goods.length; i += 8) {
      e.reply(goods.slice(i, i + 8), false, { at: true });
      await sleep(500);
    }
    /** 回复 */
    return false;
  }
  async noticeSellAllGoods(e) {
    if (!verc({ e })) return false;
    let reg = new RegExp(/^1$/);
    let new_msg = this.e.msg;
    let difficulty = reg.exec(new_msg);
    if (!difficulty) {
      e.reply('已取消出售', false, { at: true });
      /** 结束上下文 */
      this.finish('noticeSellAllGoods');
      return false;
    }
    /** 结束上下文 */
    this.finish('noticeSellAllGoods');
    /**出售*/

	if (!e.isGroup) {
		return;
	}
	let usr_qq = e.user_id;

    //有无存档
    let najie = await data.getData('najie', usr_qq);
    let commodities_price = 0;
    let wupin = [
      	'装备',
      	'丹药',
      	'道具',
      	'功法',
		'草药',
		'材料',
		'盒子',
		'仙宠口粮',
		'仙宠',
		'食材',
    ];
    for (let i of wupin) {
      for (let l of najie[i]) {
        if (l && l.islockd == 0) {
          console.log(await foundthing(l.name).出售价)
          //纳戒中的数量
          let quantity = l.数量;
          if(l.name!="秘境之匙"){
            await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
            commodities_price = commodities_price + l.出售价 * quantity;
          }else{
            await Add_najie_thing(usr_qq, l.name, l.class, -quantity, l.pinji);
            commodities_price = commodities_price + 2000000 * quantity;
          }
        }
      }
    }
    await Add_灵石(usr_qq, commodities_price);
    e.reply(await get_log_img(`出售成功!  获得${commodities_price}灵石 `))
    return false;
  }

	//#(装备|服用|使用)物品*数量
	async all_xiuweidan(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//检索方法
		let najie = await data.getData('najie', usr_qq);
		let xiuwei = 0;
		for (let l of najie.丹药) {
			if (l.type == '修为') {
				//纳戒中的数量
				let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
				await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
				xiuwei = xiuwei + l.exp * quantity;
			}
		}
		await Add_修为(usr_qq, xiuwei);
		e.reply(`服用成功,修为增加${xiuwei}`);
		return;
	}

	//#(装备|服用|使用)物品*数量
	async all_xueqidan(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}

		//检索方法
		let najie = await data.getData('najie', usr_qq);
		let xueqi = 0;
		for (let l of najie.丹药) {
			if (l.type == '血气') {
				//纳戒中的数量
				let quantity = await exist_najie_thing(usr_qq, l.name, l.class);
				await Add_najie_thing(usr_qq, l.name, l.class, -quantity);
				xueqi = xueqi + l.xueqi * quantity;
			}
		}
		await Add_血气(usr_qq, xueqi);
		e.reply(`服用成功,血气增加${xueqi}`);
		return;
	}

	async all_zhuangbei(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//检索方法
		let najie = await data.getData('najie', usr_qq);
		let equipment = await data.getData('equipment', usr_qq);
		let wuqi = equipment.武器;
		let fabao = equipment.法宝;
		let huju = equipment.护具;
		//选择最高攻击武器,最高暴击法宝,最高防御护具
		for (let i = 0; i < najie.装备.length; i++) {
			if (najie.装备[i].type == '武器') {
				if (wuqi.atk < najie.装备[i].atk) {
					wuqi = najie.装备[i];
				} else if (wuqi.atk == najie.装备[i].atk) {
					if (wuqi.bao < najie.装备[i].bao) {
						wuqi = najie.装备[i];
					}
				}
			} else if (najie.装备[i].type == '法宝') {
				if (fabao.bao < najie.装备[i].bao) {
					fabao = najie.装备[i];
				} else if (fabao.bao == najie.装备[i].bao) {
					if (fabao.atk < najie.装备[i].atk) {
						fabao = najie.装备[i];
					}
				}
			} else if (najie.装备[i].type == '护具') {
				if (huju.def < najie.装备[i].def) {
					huju = najie.装备[i];
				} else if (huju.def == najie.装备[i].def) {
					if (huju.HP < najie.装备[i].HP) {
						huju = najie.装备[i];
					}
				}
			}
		}
		if (wuqi.name == equipment.武器.name && wuqi.pinji == equipment.武器.pinji) {
		} else {
			await instead_equipment(usr_qq, wuqi);
		}
		if (fabao.name == equipment.法宝.name && fabao.pinji == equipment.法宝.pinji) {
		} else {
			await instead_equipment(usr_qq, fabao);
		}
		if (huju.name == equipment.护具.name && huju.pinji == equipment.护具.pinji) {
		} else {
			await instead_equipment(usr_qq, huju);
		}
		let img = await get_equipment_img(e);
		e.reply(img);
		return;
	}

	async all_learn(e) {
		//不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let usr_qq = e.user_id;
		//有无存档
		let ifexistplay = await existplayer(usr_qq);
		if (!ifexistplay) {
			return;
		}
		//检索方法
		let najie = await data.getData('najie', usr_qq);
		let player = await Read_player(usr_qq);
		let gongfa = [];
		let name = '';
		for (var l of najie.功法) {
			let lingen = player.灵根.name;
			let yuansu = [
				'仙之心·火',
				'仙之心·水',
				'仙之心·雷',
				'仙之心·岩',
				'仙之心·冰',
				'仙之心·风',
				'仙之心·木',
			];
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
				let arr = [
					'六稻-军略',
					'六稻-文伐',
					'六稻-金鼓',
					'孙子-兵势',
					'孙子-始计',
					'孙子-谋攻',
					'二十四篇-治军',
					'二十四篇-治乱',
					'子午谷谋',
					'孟德新书',
				];
				for (let i = 0; i < arr.length; i++) {
					player = await Read_player(usr_qq);
					let islearned = player.学习的功法.find((item) => item == l.name);
					if (!islearned) {
						if (l.name != arr[i]) {
							await Add_najie_thing(usr_qq, l.name, '功法', -1);
							await Add_player_学习功法(usr_qq, l.name);
							name = name + ' ' + l.name;
						}
					}
				}
			} else {
				player = await Read_player(usr_qq);
				let islearned = player.学习的功法.find((item) => item == l.name);
				if (!islearned) {
					await Add_najie_thing(usr_qq, l.name, '功法', -1);
					await Add_player_学习功法(usr_qq, l.name);
					name = name + ' ' + l.name;
				}
			}
		}
		if (name) {
			e.reply(`你学会了${name},可以在【#我的炼体】中查看`);
		} else {
			e.reply('无新功法');
		}
		return;
	}
}

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
