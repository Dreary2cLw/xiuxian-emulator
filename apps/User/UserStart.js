import plugin from '../../../../lib/plugins/plugin.js';
import data from '../../model/XiuxianData.js';
import config from '../../model/Config.js';
import fs from 'fs';
import {
  __PATH,
  Add_HP,
  Add_najie_thing,
  Add_修为,
  Add_灵石,
  Add_血气,
  existplayer,
  exist_najie_thing,
  get_random_fromARR,
  get_random_talent,
  getLastsign,
  isNotNull,
  Read_player,
  shijianc,
  Write_equipment,
  Write_najie,
  Write_player
} from '../Xiuxian/xiuxian.js';
import { get_player_img } from '../ShowImeg/showData.js';

/**
 * 全局
 */
let allaction = false;//全局状态判断
/**
 * 交易系统
 */
export class UserStart extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'UserStart',
      /** 功能描述 */
      dsc: '交易模块',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 600,
      rule: [
        {
          reg: '^#踏入仙途$',
          fnc: 'Create_player'
        },
        {
          reg: '^#再入仙途$',
          fnc: 'reCreate_player'
        },
        {
          reg: '^#我的练气$',
          fnc: 'Show_player'
        },
        {
          reg: '^#设置性别.*$',
          fnc: 'Set_sex'
        },
        {
          reg: '^#(改名.*)|(设置道宣.*)$',
          fnc: 'Change_player_name'
        },
        /*{
            reg: '^#我的功法$',
            fnc: 'Show_GongFa'
        },*/
        {
          reg: '^#修仙签到$',
          fnc: 'daily_gift'
        },
        {
          	reg: '^(频道号)$',
			fnc: 'pingdaomsg',
        },
        {
          reg: '^#我的养老金$',
          fnc: 'yanglao_price',
        },
        {
          reg: '^#缴纳养老金.*$',
          fnc: 'pay_yanglao',
        },
        {
          reg: '^#一键加工$',
          fnc: 'quick_use',
        },
        {
          reg: '^#一键签到$',
          fnc: 'quick_day',
        }
      ]
    });
    this.xiuxianConfigData = config.getConfig('xiuxian', 'xiuxian');
  }

  //#我的功法
  /*async Show_GongFa(e) {
      if (!e.isGroup) {
        return;
      }
      let usr_qq = e.user_id;
      //有无存档
      let ifexistplay = await existplayer(usr_qq);
      if (!ifexistplay) {
          return;
      }
      let img = await get_gongfa_img(e);
      e.reply(img);
      return;
  }*/

  ///踏入仙途
  async Create_player(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;
    //判断是否为匿名创建存档
    if (usr_qq == 80000000) {
      return;
    }
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (ifexistplay) {
      this.Show_player(e);
      return;
    }
    //判断是否为黑名单
    if (usr_qq == 392852264 || usr_qq == 1027447951 || usr_qq == 1825945633 || usr_qq == 3478593180 || usr_qq == 1259766981) {
      e.reply('您已被作者拉至黑名单');
      return;
    }
    //初始化玩家信息
    let File_msg = fs.readdirSync(__PATH.player_path);
    let n = File_msg.length + 1;
    let talent = await get_random_talent();
    let new_player = {
      'id': e.user_id,
      'sex': 0,//性别
      '名号': `路人甲${n}号`,
      '宣言': '这个人很懒还没有写',
      'level_id': 1,//练气境界
      'Physique_id': 1,//练体境界
      'race': 1,//种族
      '修为': 1,//练气经验
      '血气': 1,//练体经验
      '灵石': 1000,
      '灵根': talent,
      '神石': 0,
      'favorability': 0,
      'breakthrough': false,
      'linggen': [],
      'linggenshow': 1,//灵根显示，隐藏
      '学习的功法': [],
      '修炼效率提升': talent.eff,
      '连续签到天数': 0,
      '攻击加成': 0,
      '防御加成': 0,
      '生命加成': 0,
      'power_place': 1,//仙界状态
      '当前血量': 8000,
      'lunhui': 0,
      'lunhuiBH': 0,
      '轮回点': 10,
      'occupation': [],//职业
      'occupation_level': 1,
      '镇妖塔层数': 0,
      '神魄段数': 0,
      '魔道值': 0,
      '饱食度': 0,
      '热量': 0,
      '仙宠': [],
      '练气皮肤': 0,
      '装备皮肤': 0,
      '幸运': data.necklace_list.find(item => item.name == '幸运儿').加成,
      '熔炉': 0,
      '附魔台': 0,
      '书架': 0,
      '师徒任务阶段': 0,
      '师徒积分': 0,
      '副职': {
        '职业名': [],
        '职业经验': 0,
        '职业等级': 1
      }
    };
    await Write_player(usr_qq, new_player);
    //初始化装备
    let new_equipment = {
      '武器': data.wuqi_list.find(item => item.name == '烂铁匕首'),
      '护具': data.huju_list.find(item => item.name == '破铜护具'),
      '法宝': data.fabao_list.find(item => item.name == '廉价炮仗'),
      '项链': data.necklace_list.find(item => item.name == '幸运儿')
    };
    await Write_equipment(usr_qq, new_equipment);
    //初始化纳戒
    let new_najie = {
      '等级': 1,
      '灵石上限': 5000,
      '灵石': 0,
      '装备': [],
      '丹药': [],
      '道具': [],
      '功法': [],
      '草药': [],
      '材料': [],
      '食材': [],
      '盒子': [],
      '仙宠': [],
      '仙宠口粮': []
    };
    await Write_najie(usr_qq, new_najie);
    await Add_HP(usr_qq, 999999);
    await this.Show_player(e);
    let i = 0;
    let action = await redis.get('xiuxian:player:' + 10 + ':biguang');
    action = await JSON.parse(action);
    if (action == null) {
      action = [];
    }
    for (i = 0; i < action.length; i++) {
      if (action[i].qq == usr_qq) {
        break;
      }
    }
    if (i == action.length) {
      let arr = {
        biguan: 0,//闭关状态1
        biguanxl: 0,//增加效率
        xingyun: 0,
        lianti: 0,//1
        ped: 0,//1
        modao: 0,
        beiyong1: 0,
        beiyong2: 0,//1
        beiyong3: 0,//2
        beiyong4: 0,
        beiyong5: 0,
        qq: usr_qq
      };
      action.push(arr);
      console.log(arr);
      await redis.set('xiuxian:player:' + 10 + ':biguang', JSON.stringify(action));
    }
    return;
  }

  //重新修仙
  async reCreate_player(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      e.reply('没存档你转世个锤子!');
      return;
    } else {
      //没有存档，初始化次数
      await redis.set('xiuxian:player:' + usr_qq + ':reCreate_acount', 1);
    }
    let acount = await redis.get('xiuxian:player:' + usr_qq + ':reCreate_acount');
    if (acount == undefined || acount == null || acount == NaN || acount <= 0) {
      await redis.set('xiuxian:player:' + usr_qq + ':reCreate_acount', 1);
    }
    let player = await data.getData('player', usr_qq);
    //重生之前先看状态
    if (player.灵石 <= 0) {
      e.reply(`负债无法再入仙途`);
      return;
    }
    await Go(e);
    if (allaction) {
      console.log(allaction);
    } else {
      return;
    }
    allaction = false;
    let now = new Date();
    let nowTime = now.getTime(); //获取当前时间戳
    let lastrestart_time = await redis.get('xiuxian:player:' + usr_qq + ':last_reCreate_time');//获得上次重生时间戳,
    lastrestart_time = parseInt(lastrestart_time);
    const time = this.xiuxianConfigData.CD.reborn;
    let rebornTime = parseInt(60000 * time);
    if (nowTime < lastrestart_time + rebornTime) {
      let waittime_m = Math.trunc((lastrestart_time + rebornTime - nowTime) / 60 / 1000);
      let waittime_s = Math.trunc(((lastrestart_time + rebornTime - nowTime) % 60000) / 1000);
      e.reply(`每${rebornTime / 60 / 1000}分钟只能转世一次` + `剩余cd:${waittime_m}分 ${waittime_s}秒`);
      return;
    }
    /** 设置上下文 */
    this.setContext('RE_xiuxian');
    /** 回复 */
    await e.reply('一旦转世一切当世与你无缘,你真的要重生吗?回复:【断绝此生】或者【再继仙缘】进行选择', false, { at: true });
    return;
  }

  //重生方法
  async RE_xiuxian(e) {
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;
    /** 内容 */
    let new_msg = this.e.message;
    let choice = new_msg[0].text;
    let now = new Date();
    let nowTime = now.getTime(); //获取当前时间戳
    if (choice == '再继仙缘') {
      await this.reply('重拾道心,继续修行');
      /** 结束上下文 */
      this.finish('RE_xiuxian');
      return;
    } else if (choice == '断绝此生') {
      //得到重生次数
      let acount = await redis.get('xiuxian:player:' + usr_qq + ':reCreate_acount');
      //
      if (acount >= 15) {
        e.reply('灵魂虚弱，已不可转世！');
        return;
      }
      acount = Number(acount);
      acount++;
      //重生牵扯到宗门模块
      let player = await data.getData('player', usr_qq);
      if (isNotNull(player.宗门)) {
        if (player.宗门.职位 != '宗主') {//不是宗主
          let ass = data.getAssociation(player.宗门.宗门名称);
          ass[player.宗门.职位] = ass[player.宗门.职位].filter(item => item != usr_qq);
          ass['所有成员'] = ass['所有成员'].filter(item => item != usr_qq);//原来的成员表删掉这个B
          await data.setAssociation(ass.宗门名称, ass);
          delete player.宗门;
          await data.setData('player', usr_qq, player);
        } else {//是宗主
          let ass = data.getAssociation(player.宗门.宗门名称);
          if (ass.所有成员.length < 2) {
            fs.rmSync(`${data.filePathMap.association}/${player.宗门.宗门名称}.json`);
          } else {
            ass['所有成员'] = ass['所有成员'].filter(item => item != usr_qq);//原来的成员表删掉这个B
            //随机一个幸运儿的QQ,优先挑选等级高的
            let randmember_qq;
            if (ass.长老.length > 0) {
              randmember_qq = await get_random_fromARR(ass.长老);
            } else if (ass.内门弟子.length > 0) {
              randmember_qq = await get_random_fromARR(ass.内门弟子);
            } else {
              randmember_qq = await get_random_fromARR(ass.所有成员);
            }
            let randmember = await data.getData('player', randmember_qq);//获取幸运儿的存档
            ass[randmember.宗门.职位] = ass[randmember.宗门.职位].filter((item) => item != randmember_qq);//原来的职位表删掉这个幸运儿
            ass['宗主'] = randmember_qq;//新的职位表加入这个幸运儿
            randmember.宗门.职位 = '宗主';//成员存档里改职位
            await data.setData('player', randmember_qq, randmember);//记录到存档
            await data.setAssociation(ass.宗门名称, ass);//记录到宗门
          }
        }
      }
      fs.rmSync(`${__PATH.player_path}/${usr_qq}.json`);
      fs.rmSync(`${__PATH.equipment_path}/${usr_qq}.json`);
      fs.rmSync(`${__PATH.najie_path}/${usr_qq}.json`);
      e.reply([segment.at(usr_qq), '当前存档已清空!开始重生']);
      e.reply([segment.at(usr_qq), '来世，信则有，不信则无，岁月悠悠，世间终会出现两朵相同的花，千百年的回眸，一花凋零，一花绽。是否为同一朵，任后人去评断！！']);
      await this.Create_player(e);
      await redis.set('xiuxian:player:' + usr_qq + ':last_reCreate_time', nowTime);//redis设置本次改名时间戳
      await redis.set('xiuxian:player:' + usr_qq + ':reCreate_acount', acount);
    } else {
      this.setContext('RE_xiuxian');
      await this.reply('请回复:【断绝此生】或者【再继仙缘】进行选择', false, { at: true });
      return;
    }
    /** 结束上下文 */
    this.finish('RE_xiuxian');
    return;
  }

  ///我的练气
  async Show_player(e) {
    //不开放私聊功能
    let usr_qq = e.user_id;
    //有无存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      return;
    }
    let player = await Read_player(usr_qq);

    //判断是否为黑名单
    if (usr_qq == 392852264 || usr_qq == 1027447951 || usr_qq == 1825945633 || usr_qq == 3478593180 || usr_qq == 1259766981) {
      e.reply('您已被作者拉至黑名单');
      return;
    }
    let img = await get_player_img(e);
    e.reply(img);
    return;
  }

  async Set_sex(e) {
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
    let player = await Read_player(usr_qq);
    if (player.sex != 0) {
      e.reply('每个存档仅可设置一次性别！');
      return;
    }
    //命令判断
    let msg = e.msg.replace('#设置性别', '');
    if (msg != '男' && msg != '女') {
      e.reply('请发送#设置性别男 或 #设置性别女');
      return;
    }
    player.sex = msg == '男' ? 2 : 1;
    await data.setData('player', usr_qq, player);
    e.reply(`${player.名号}的性别已成功设置为 ${msg}。`);
  }
  async pingdaomsg(e){
    //不开放私聊功能
		if (!e.isGroup) {
			return;
		}
		let A = e.user_id;
		//console.log(e);

		//先判断
		let ifexistplay_A = await existplayer(A);
		if (!ifexistplay_A || e.isPrivate) {
			return;
		}
      let atItem = e.message.filter((item) => item.type === 'at');
      let B = atItem[0].qq;
      e.reply(B);
      return
  }
  async yanglao_price(e){
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let A = e.user_id;
    //console.log(e);

    //先判断
    let ifexistplay_A = await existplayer(A);
    if (!ifexistplay_A || e.isPrivate) {
      return;
    }
    let player = await Read_player(A);
    let money = 0;
    if(isNotNull(player.养老金)){
      money = player.养老金;
    }
    if(money>=50000000){
      e.reply('您已缴纳养老金超过五千万，获得养老资格');
    }else {
      e.reply('您已缴纳养老金：'+money);
    }
    return
  }
  async pay_yanglao(e){
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;

    //自己没存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      e.reply('无存档');
      return;
    }

    //全局状态判断
    //获取游戏状态
    //全局状态判断
    await Go(e);
    if (allaction) {
    } else {
      e.reply('状态不为空闲');
      return;
    }
    allaction = false;

    //获取发送灵石数量
    let lingshi = e.msg.replace('#', '');
    lingshi = lingshi.replace('缴纳养老金', '');
    let code = lingshi.split('*');
    lingshi = code[0];
    console.log(lingshi)
    if (!isNaN(parseFloat(lingshi)) && isFinite(lingshi)) {
    } else {
      e.reply('非法');
      return;
    }
    lingshi = Number(lingshi);
    lingshi = Math.trunc(lingshi);
    lingshi = code[0];
    if (lingshi <= 0) {
      e.reply('灵石为负');
      return;
    }
    lingshi = Math.trunc(lingshi);
    let player = await Read_player(usr_qq);
    if (player.灵石 <= lingshi) {
      e.reply('醒醒，你没有那么多');
      return;
    }


    if(!isNotNull(player.养老金)){
      player.养老金 = 0;
    }
    let money = Number(player.养老金);
    if(player.养老金>=50000000){
      e.reply('您已缴纳养老金超过五千万，获得养老资格,无须再缴纳');
      return ;
    }else{
      await Add_灵石(usr_qq, -lingshi);
      player.养老金 = money + lingshi;
    }

    await Write_player(usr_qq, player);
    e.reply('成功缴纳养老金：'+lingshi);
    return;
  }
  async quick_use(e){
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;

    //自己没存档
    let ifexistplay = await existplayer(usr_qq);
    if (!ifexistplay) {
      e.reply('无存档');
      return;
    }

    //全局状态判断
    //获取游戏状态
    //全局状态判断
    await Go(e);
    if (allaction) {
    } else {
      return;
    }
    allaction = false;

    let player = await Read_player(usr_qq);

    let money = 0;
    if(isNotNull(player.养老金)){
      money = player.养老金;
    }

    if (money < 50000000) {
      e.reply('此指令为养老指令，你似乎没有养老资格？');
      return;
    }

    let dao = await exist_najie_thing(usr_qq, '菜刀', '道具');
    if (isNotNull(dao) && dao >= 5) {

    } else {
      e.reply('菜刀不足五个');
      return;
    }

    let ji = await exist_najie_thing(usr_qq, '野鸡', '食材');
    let zhu = await exist_najie_thing(usr_qq, '野猪', '食材');
    let niu = await exist_najie_thing(usr_qq, '野牛', '食材');
    let yang = await exist_najie_thing(usr_qq, '野羊', '食材');
    let tu = await exist_najie_thing(usr_qq, '野兔', '食材');
    let msg = [];
    if(isNotNull(ji) && ji >= 0){
      let jimsg = `加工野鸡X`+ji
      await Add_najie_thing(usr_qq, '菜刀', '道具', -1);
      await Add_najie_thing(usr_qq, '野鸡', '食材', -ji);
      let wupin = data.jiagong_list.find(item => item.name == '野鸡');
      for (let i = 0; i < wupin.outputs.length; i++) {
        const output = wupin.outputs[i];
        await Add_najie_thing(usr_qq, output.name, output.class, (output.amount * ji + output.const_amount));
        jimsg = jimsg+`，获得${output.name}${output.amount * ji + output.const_amount}个`;
      }
      jimsg = jimsg+`\n`;
      msg.push(jimsg);
    }

    if(isNotNull(zhu) && zhu >= 0){
      let zhumsg = `加工野猪X`+zhu
      await Add_najie_thing(usr_qq, '菜刀', '道具', -1);
      await Add_najie_thing(usr_qq, '野猪', '食材', -zhu);
      let wupin = data.jiagong_list.find(item => item.name == '野猪');
      for (let i = 0; i < wupin.outputs.length; i++) {
        const output = wupin.outputs[i];
        await Add_najie_thing(usr_qq, output.name, output.class, (output.amount * zhu + output.const_amount));
        zhumsg = zhumsg+ `，获得${output.name}${output.amount * zhu + output.const_amount}个`;
      }
      zhumsg = zhumsg+`\n`;
      msg.push(zhumsg);
    }

    if(isNotNull(niu) && niu >= 0){
      let niumsg = `加工野牛X`+niu
      await Add_najie_thing(usr_qq, '菜刀', '道具', -1);
      await Add_najie_thing(usr_qq, '野牛', '食材', -niu);
      let wupin = data.jiagong_list.find(item => item.name == '野牛');
      for (let i = 0; i < wupin.outputs.length; i++) {
        const output = wupin.outputs[i];
        await Add_najie_thing(usr_qq, output.name, output.class, (output.amount * niu + output.const_amount));
        niumsg = niumsg +`，获得${output.name}${output.amount * niu + output.const_amount}个`;
      }
      niumsg = niumsg+`\n`;
      msg.push(niumsg);
    }

    if(isNotNull(yang) && yang >= 0){
      let yangmsg = `加工野羊X`+yang
      await Add_najie_thing(usr_qq, '菜刀', '道具', -1);
      await Add_najie_thing(usr_qq, '野羊', '食材', -yang);
      let wupin = data.jiagong_list.find(item => item.name == '野羊');
      for (let i = 0; i < wupin.outputs.length; i++) {
        const output = wupin.outputs[i];
        await Add_najie_thing(usr_qq, output.name, output.class, (output.amount * yang + output.const_amount));
        yangmsg = yangmsg+`，获得${output.name}${output.amount * yang + output.const_amount}个`;
      }
      yangmsg = yangmsg+`\n`;
      msg.push(yangmsg);
    }

    if(isNotNull(tu) && tu >= 0){
      let tumsg = `加工野兔X`+tu
      await Add_najie_thing(usr_qq, '菜刀', '道具', -1);
      await Add_najie_thing(usr_qq, '野兔', '食材', -tu);
      let wupin = data.jiagong_list.find(item => item.name == '野兔');
      for (let i = 0; i < wupin.outputs.length; i++) {
        const output = wupin.outputs[i];
        await Add_najie_thing(usr_qq, output.name, output.class, (output.amount * tu + output.const_amount));
        tumsg = tumsg+`，获得${output.name}${output.amount * tu + output.const_amount}个`;
      }
      tumsg = tumsg+`\n`;
      msg.push(tumsg);
    }
    e.reply(msg);
    return;
  }

  async quick_day(e){
    //不开放私聊功能
    if (!e.isGroup) {
      return;
    }
    let usr_qq = e.user_id;

    //全局状态判断
    //获取游戏状态
    //全局状态判断
    await Go(e);
    if (allaction) {
    } else {
      return;
    }
    allaction = false;

    let money = 0;
    if(isNotNull(player.养老金)){
      money = player.养老金;
    }

    if (money < 50000000) {
      e.reply('此指令为养老指令，你似乎没有养老资格？');
      return;
    }
    let msg = [];

    //签到
    let qiandao_msg = '修仙签到:';
    let now = new Date();
    let nowTime = now.getTime(); //获取当前日期的时间戳
    let Yesterday = await shijianc(nowTime - 24 * 60 * 60 * 1000);//获得昨天日期
    let Today = await shijianc(nowTime);
    let lastsign_time = await getLastsign(usr_qq);//获得上次签到日期
    if (Today.Y == lastsign_time.Y && Today.M == lastsign_time.M && Today.D == lastsign_time.D && usr_qq != 18236763786415097341) {
      qiandao_msg = qiandao_msg + `今日已经签到过了`;
    }else{
      let Sign_Yesterday;        //昨日日是否签到
      if (Yesterday.Y == lastsign_time.Y && Yesterday.M == lastsign_time.M && Yesterday.D == lastsign_time.D) {
        Sign_Yesterday = true;
      } else {
        Sign_Yesterday = false;
      }
      await redis.set('xiuxian:player:' + usr_qq + ':lastsign_time', nowTime);//redis设置签到时间
      let player = await data.getData('player', usr_qq);
      if (player.连续签到天数 == 7 || !Sign_Yesterday) {//签到连续7天或者昨天没有签到,连续签到天数清零
        player.连续签到天数 = 0;
      }
      player.连续签到天数 += 1;
      data.setData('player', usr_qq, player);
      //给奖励
      let gift_xiuwei = player.连续签到天数 * 3000;
      await Add_najie_thing(usr_qq, '秘境之匙', '道具', this.xiuxianConfigData.Sign.ticket);
      await Add_najie_thing(usr_qq, "仙子邀约", "道具", this.xiuxianConfigData.Sign.yaoyue);
      await Add_najie_thing(usr_qq, "小竹藏的新春铁盒", "道具", this.xiuxianConfigData.Sign.xiaozhu);
      //sb
      //await Add_najie_thing(usr_qq, "鸡神的馈赠", "道具", this.xiuxianConfigData.Sign.jishen);
      await Add_修为(usr_qq, gift_xiuwei);
      qiandao_msg = qiandao_msg + [
        segment.at(usr_qq),
        `已经连续签到${player.连续签到天数}天了，获得了${gift_xiuwei}修为,秘境之匙x${this.xiuxianConfigData.Sign.ticket},仙子邀约x${this.xiuxianConfigData.Sign.yaoyue},小竹藏的新春铁盒x${this.xiuxianConfigData.Sign.xiaozhu}`
      ];
    }

    qiandao_msg = qiandao_msg + '\n';

        //
    let lingmai_msg = '开采灵脉:';
    let player = data.getData('player', usr_qq);
   lastsign_time = await getLastsign_Explor(usr_qq); //获得上次宗门签到日期
    if (!isNotNull(player.宗门)) {
      lingmai_msg = lingmai_msg+ `你没有宗门`;
    }
    else if (data.getAssociation(player.宗门.宗门名称).宗门驻地 == 0) {
      lingmai_msg = lingmai_msg+ `你的宗门还没有驻地哦，没有灵脉可以开采`;
    }else if (
        Today.Y == lastsign_time.Y &&
        Today.M == lastsign_time.M &&
        Today.D == lastsign_time.D
    ){
      lingmai_msg = lingmai_msg+ `今日已经开采过灵脉，不可以竭泽而渔哦，明天再来吧`;
    }else{
      let ass = data.getAssociation(player.宗门.宗门名称);
      //都通过了，可以进行开采了
      await redis.set('xiuxian:player:' + usr_qq + ':getLastsign_Explor', nowTime); //redis设置签到时间

      //给奖励
      let dongTan = await data.bless_list.find((item) => item.name == ass.宗门驻地);

      let gift_lingshi = 0;

      if (ass.宗门神兽 == '麒麟') {
        gift_lingshi = (1200 * (dongTan.level + 1) * player.level_id) / 2;
      } else {
        gift_lingshi = (1200 * dongTan.level * player.level_id) / 2;
      }
      gift_lingshi *= 2;
      let xf = 1;
      if (ass.power == 1) {
        xf = 10;
      }
      let num = Math.trunc(gift_lingshi);
      // console.log("加数"+fuli+"宗门建设等级"+ass.宗门建设等级)
      console.log('原玩家灵石' + player.灵石 + '原灵石池' + ass.灵石池);
      if (ass.灵石池 + num > 宗门灵石池上限[ass.宗门等级 - 1] * xf) {
        ass.灵石池 = 宗门灵石池上限[ass.宗门等级 - 1] * xf;
      } else {
        ass.灵石池 += num;
      }
      await Add_灵石(usr_qq, num);
      console.log('加完后灵石' + player.灵石 + '加完后灵石池' + ass.灵石池);

      await data.setAssociation(ass.宗门名称, ass);
      // console.log("原灵石池加数"+num+"建设加成"+fuli+"应得两个地点灵石"+num+fuli)
      lingmai_msg = lingmai_msg+
          `本次开采灵脉获得${gift_lingshi * 2}灵石，上交一半给宗门，最后获得${num}灵石`;
    }
    lingmai_msg = lingmai_msg + '\n';

    //宗门俸禄
    let fenglu_msg = '宗门俸禄:';
    lastsign_time = await getLastsign_Asso(usr_qq); //获得上次宗门签到日期
    if (!isNotNull(player.宗门)) {
      fenglu_msg = fenglu_msg+ `你没有宗门`;
    }else if(isNotMaintenance(data.getAssociation(player.宗门.宗门名称))){
      fenglu_msg = fenglu_msg+ `宗门尚未维护，快找宗主维护宗门`;

    }else if (
        Today.Y == lastsign_time.Y &&
        Today.M == lastsign_time.M &&
        Today.D == lastsign_time.D
    ) {
      fenglu_msg = fenglu_msg+ `今日已经领取过了`;
    }else if(player.宗门.职位 == '外门弟子' || player.宗门.职位 == '内门弟子'){
      fenglu_msg = fenglu_msg + '没有资格领取俸禄';
    } else if(data.getAssociation(player.宗门.宗门名称).灵石池<500000){
      fenglu_msg = fenglu_msg + '宗门灵石池不够发放俸禄啦，快去为宗门做贡献吧';
    }else {
      let ass = data.getAssociation(player.宗门.宗门名称);
      //给奖励
      let temp = player.宗门.职位;
      let n = 1;
      if (temp == '长老') {
        n = 3;
      }
      if (temp == '副宗主') {
        n = 4;
      }
      if (temp == '宗主') {
        n = 5;
      }
      let fuli = Number(Math.trunc(ass.宗门建设等级 * 2000));
      let gift_lingshi = Math.trunc(ass.宗门等级 * 1200 * n + fuli);
      gift_lingshi = gift_lingshi / 2;
      ass.灵石池 -= gift_lingshi;
      player.灵石 += gift_lingshi;
      await redis.set('xiuxian:player:' + usr_qq + ':lastsign_Asso_time', nowTime); //redis设置签到时间
      await data.setData('player', usr_qq, player);
      await data.setAssociation(ass.宗门名称, ass);
      fenglu_msg = fenglu_msg + `宗门俸禄领取成功,获得了${gift_lingshi}灵石`;
    }
    fenglu_msg = lingmai_msg + '\n';

    //神兽赐福
    let shenshou_msg = '神兽赐福:';

    lastsign_time = await getLastsign_Bonus(usr_qq); //获得上次宗门签到日期
    //无宗门
    if (!isNotNull(player.宗门)) {
      shenshou_msg = shenshou_msg+ `你没有宗门`;
    } else if (
        Today.Y == lastsign_time.Y &&
        Today.M == lastsign_time.M &&
        Today.D == lastsign_time.D
    ) {
      shenshou_msg = shenshou_msg+ `今日已经接受过神兽赐福了，明天再来吧`;
    }else{
      await redis.set('xiuxian:player:' + usr_qq + ':getLastsign_Bonus', nowTime); //redis设置签到时间
      let ass = data.getAssociation(player.宗门.宗门名称);
      let random = Math.random();
      let flag = 0.5;
      //根据好感度获取概率
      let i = 0;
      let action = await redis.get('xiuxian:player:' + 10 + ':biguang');
      action = await JSON.parse(action);
      for (i = 0; i < action.length; i++) {
        if (action[i].qq == usr_qq) {
          if (action[i].beiyong2 > 0) {
            action[i].beiyong2--;
          }
          let up1 = action[i].beiyong3;
          flag = 0.7 - up1;
          if (player.favorability > 1000) {
            flag = 0.1 - up1;
          } else if (player.favorability > 500) {
            flag = 0.3 - up1;
          } else if (player.favorability > 200) {
            flag = 0.5 - up1;
          }
          console.log(flag);

          if (action[i].beiyong2 == 0) {
            action[i].beiyong3 = 0;
          }
          console.log(action[i]);
        }
      }
      await redis.set('xiuxian:player:' + 10 + ':biguang', JSON.stringify(action));
      if (random > flag) {
        let randomA = Math.random();
        let res = 1;
        if (randomA > 0.85) {
          res = 1;
        } else if (randomA > 0.5) {
          res = 2;
        } else {
          res = 3;
        }

        let location = 0;
        let item_name = '';
        let item_class = '';
        let now_level_id = data.Level_list.find(
            (item) => item.level_id == player.level_id
        ).level_id;
        let body_level_id = data.Level_list.find(
            (item) => item.level_id == player.Physique_id
        ).level_id;
        //获得奖励
        let randomB = Math.random();
        if (ass.宗门神兽 == '麒麟') {
          //给丹药,隐藏神兽,赐福时气血和修为都加,宗门驻地等级提高一级
          if (flag == 0.1 && res == 1 && randomB > 0.8) {
            location = Math.floor(Math.random() * (data.qilin.length / res));
            item_name = data.qilin[location].name;
            item_class = data.qilin[location].class;
          } else {
            location = Math.floor(Math.random() * (data.danyao_list.length / res));
            item_name = data.danyao_list[location].name;
            item_class = data.danyao_list[location].class;
          }
          await Add_血气(usr_qq, 500 * body_level_id);
          await Add_修为(usr_qq, 500 * now_level_id);
          await Add_HP(usr_qq, parseInt(player.血量上限));
          await Add_najie_thing(usr_qq, item_name, item_class, 1);
        } else if (ass.宗门神兽 == '青龙') {
          //给功法，赐福加修为
          if (flag <= 0.1 && res == 1 && randomB > 0.8) {
            location = Math.floor(Math.random() * (data.qinlong.length / res));
            item_name = data.qinlong[location].name;
            item_class = data.qinlong[location].class;
          } else {
            location = Math.floor(Math.random() * (data.gongfa_list.length / res));
            item_name = data.gongfa_list[location].name;
            item_class = data.gongfa_list[location].class;
          }
          await Add_修为(usr_qq, 300 * now_level_id);
          await Add_HP(usr_qq, parseInt(player.血量上限));
          await Add_najie_thing(usr_qq, item_name, item_class, 1);
        } else if (ass.宗门神兽 == '玄武') {
          //给护具，赐福加气血
          if (flag == 0.1 && res == 1 && randomB > 0.8) {
            location = Math.floor(Math.random() * (data.xuanwu.length / res));
            item_name = data.xuanwu[location].name;
            item_class = data.xuanwu[location].class;
          } else {
            location = Math.floor(Math.random() * (data.huju_list.length / res));
            item_name = data.huju_list[location].name;
            item_class = data.huju_list[location].class;
          }
          await Add_血气(usr_qq, 300 * body_level_id);
          await Add_HP(usr_qq, parseInt(player.血量上限));
          await Add_najie_thing(usr_qq, item_name, item_class, 1);
        } else if (ass.宗门神兽 == '朱雀') {
          //给法宝，赐福加修为
          if (flag == 0.1 && res == 1 && randomB > 0.8) {
            location = Math.floor(Math.random() * (data.xuanwu.length / res));
            item_name = data.xuanwu[location].name;
            item_class = data.xuanwu[location].class;
          } else {
            location = Math.floor(Math.random() * (data.fabao_list.length / res));
            item_name = data.fabao_list[location].name;
            item_class = data.fabao_list[location].class;
          }
          await Add_修为(usr_qq, 300 * now_level_id);
          await Add_HP(usr_qq, parseInt(player.血量上限));
          await Add_najie_thing(usr_qq, item_name, item_class, 1);
        } else {
          //白虎给武器 赐福加气血
          if (flag == 0.1 && res == 1 && randomB > 0.8) {
            location = Math.floor(Math.random() * (data.xuanwu.length / res));
            item_name = data.xuanwu[location].name;
            item_class = data.xuanwu[location].class;
          } else {
            location = Math.floor(Math.random() * (data.wuqi_list.length / res));
            item_name = data.wuqi_list[location].name;
            item_class = data.wuqi_list[location].class;
          }
          await Add_血气(usr_qq, 300 * body_level_id);
          await Add_HP(usr_qq, parseInt(player.血量上限));
          await Add_najie_thing(usr_qq, item_name, item_class, 1);
        }
        if (flag == 0.1 && res == 1 && randomB > 0.8) {
          shenshou_msg = shenshou_msg+`看见你来了,${ass.宗门神兽}很高兴，仔细挑选了${item_name}给你`;
        } else {
          shenshou_msg = shenshou_msg+`${ass.宗门神兽}今天心情不错，随手丢给了你${item_name}`;
        }
      } else {
        shenshou_msg = shenshou_msg + `${ass.宗门神兽}闭上了眼睛，表示今天不想理你`;
      }
    }


    shenshou_msg  = shenshou_msg + '\n';

    msg.push(qiandao_msg);
    msg.push(lingmai_msg);
    msg.push(fenglu_msg);
    msg.push(shenshou_msg);
    e.reply(msg);

    return;
  }
  //改名
  async Change_player_name(e) {
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
    let reg = new RegExp(/改名|设置道宣/);
    let func = reg.exec(e.msg);
    //
    if (func == '改名') {
      let new_name = e.msg.replace('#改名', '');
      new_name = new_name.replace(' ', '');
      new_name = new_name.replace('+', '');
      if (new_name.length == 0) {
        e.reply('改名格式为:【#改名张三】请输入正确名字');
        return;
      } else if (new_name.length > 8) {
        e.reply('玩家名字最多八字');
        return;
      }
      let player = {};
      let now = new Date();
      let nowTime = now.getTime(); //获取当前日期的时间戳
      //let Yesterday = await shijianc(nowTime - 24 * 60 * 60 * 1000);//获得昨天日期
      let Today = await shijianc(nowTime);
      let lastsetname_time = await redis.get('xiuxian:player:' + usr_qq + ':last_setname_time');//获得上次改名日期,
      lastsetname_time = parseInt(lastsetname_time);
      lastsetname_time = await shijianc(lastsetname_time);
      if (Today.Y == lastsetname_time.Y && Today.M == lastsetname_time.M && Today.D == lastsetname_time.D) {
        e.reply('每日只能改名一次');
        return;
      }
      player = await Read_player(usr_qq);
      if (player.灵石 < 1000) {
        e.reply('改名需要1000灵石');
        return;
      }
      player.名号 = new_name;
      redis.set('xiuxian:player:' + usr_qq + ':last_setname_time', nowTime);//redis设置本次改名时间戳
      player.灵石 -= 1000;
      await Write_player(usr_qq, player);
      //Add_灵石(usr_qq, -100);
      this.Show_player(e);
      return;
    }
    //设置道宣
    else if (func == '设置道宣') {
      let new_msg = e.msg.replace('#设置道宣', '');
      new_msg = new_msg.replace(' ', '');
      new_msg = new_msg.replace('+', '');
      if (new_msg.length == 0) {
        return;
      } else if (new_msg.length > 50) {
        e.reply('道宣最多50字符');
        return;
      }
      let player = {};
      let now = new Date();
      let nowTime = now.getTime(); //获取当前日期的时间戳
      //let Yesterday = await shijianc(nowTime - 24 * 60 * 60 * 1000);//获得昨天日期
      //
      let Today = await shijianc(nowTime);
      let lastsetxuanyan_time = await redis.get('xiuxian:player:' + usr_qq + ':last_setxuanyan_time');
      //获得上次改道宣日期,
      lastsetxuanyan_time = parseInt(lastsetxuanyan_time);
      lastsetxuanyan_time = await shijianc(lastsetxuanyan_time);
      if (Today.Y == lastsetxuanyan_time.Y && Today.M == lastsetxuanyan_time.M && Today.D == lastsetxuanyan_time.D) {
        e.reply('每日仅可更改一次');
        return;
      }
      //这里有问题，写不进去
      player = await Read_player(usr_qq);
      player.宣言 = new_msg;//
      redis.set('xiuxian:player:' + usr_qq + ':last_setxuanyan_time', nowTime);//redis设置本次设道置宣时间戳
      await Write_player(usr_qq, player);
      this.Show_player(e);
      return;
    }
  }

  //签到
  async daily_gift(e) {
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
    let now = new Date();
    let nowTime = now.getTime(); //获取当前日期的时间戳
    let Yesterday = await shijianc(nowTime - 24 * 60 * 60 * 1000);//获得昨天日期
    let Today = await shijianc(nowTime);
    let lastsign_time = await getLastsign(usr_qq);//获得上次签到日期
    if (Today.Y == lastsign_time.Y && Today.M == lastsign_time.M && Today.D == lastsign_time.D && usr_qq != 18236763786415097341) {
      e.reply(`今日已经签到过了`);
      return;
    }
    let Sign_Yesterday;        //昨日日是否签到
    if (Yesterday.Y == lastsign_time.Y && Yesterday.M == lastsign_time.M && Yesterday.D == lastsign_time.D) {
      Sign_Yesterday = true;
    } else {
      Sign_Yesterday = false;
    }
    await redis.set('xiuxian:player:' + usr_qq + ':lastsign_time', nowTime);//redis设置签到时间
    let player = await data.getData('player', usr_qq);
    if (player.连续签到天数 == 7 || !Sign_Yesterday) {//签到连续7天或者昨天没有签到,连续签到天数清零
      player.连续签到天数 = 0;
    }
    player.连续签到天数 += 1;
    data.setData('player', usr_qq, player);
    //给奖励
    let gift_xiuwei = player.连续签到天数 * 3000;
    await Add_najie_thing(usr_qq, '秘境之匙', '道具', this.xiuxianConfigData.Sign.ticket);
    await Add_najie_thing(usr_qq, "仙子邀约", "道具", this.xiuxianConfigData.Sign.yaoyue);
    await Add_najie_thing(usr_qq, "小竹藏的新春铁盒", "道具", this.xiuxianConfigData.Sign.xiaozhu);
    //sb
    //await Add_najie_thing(usr_qq, "鸡神的馈赠", "道具", this.xiuxianConfigData.Sign.jishen);
    await Add_修为(usr_qq, gift_xiuwei);
    let msg = [
      segment.at(usr_qq),
      `已经连续签到${player.连续签到天数}天了，获得了${gift_xiuwei}修为,秘境之匙x${this.xiuxianConfigData.Sign.ticket},仙子邀约x${this.xiuxianConfigData.Sign.yaoyue},小竹藏的新春铁盒x${this.xiuxianConfigData.Sign.xiaozhu}`
    ];
    e.reply(msg);
    return;
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
      let s = parseInt(((action_end_time - now_time) - m * 60 * 1000) / 1000);
      e.reply('正在' + action.action + '中,剩余时间:' + m + '分' + s + '秒');
      return;
    }
  }
  allaction = true;
  return;
}