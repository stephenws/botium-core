const isJSON = require('is-json')
const _ = require('lodash')

const { ConvoHeader, Convo } = require('./Convo')

const EOL = '\n'

module.exports = class CompilerTxt {
  GetHeader (script) {
    return new Promise((resolve) => {
      let lines = script.split(EOL)

      let header = {
      }

      if (lines && !lines[0].startsWith('#')) {
        header.name = lines[0]
      }
      resolve(new ConvoHeader(header))
    })
  }

  Compile (script) {
    let lines = script.split(EOL)

    let convo = {
      header: {},
      conversation: []
    }

    let currentLines = []
    let currentSender = null
    let currentChannel = null

    let parseMsg = (lines) => {
      if (!lines) return null

      let content = lines.join(' ')
      if (isJSON(content)) {
        return JSON.parse(content)
      } else {
        return lines.join(EOL)
      }
    }

    let pushPrev = () => {
      if (currentSender && currentLines) {
        const convoStep = {
          sender: currentSender,
          channel: currentChannel
        }
        let msg = parseMsg(currentLines)
        if (_.isString(msg)) {
          convoStep.messageText = msg
        } else {
          convoStep.sourceData = msg
        }
        convo.conversation.push(convoStep)
      } else if (!currentSender && currentLines) {
        convo.header.name = currentLines[0]
        if (currentLines.length > 1) {
          convo.header.description = currentLines.slice(1).join(EOL)
        }
      }
    }

    lines.forEach((line) => {
      line = line.trim()
      if (!line) {
      } else if (line.startsWith('#')) {
        pushPrev()

        currentSender = line.substr(1)
        currentChannel = null
        if (currentSender.indexOf(' ') > 0) {
          currentChannel = currentSender.substr(currentSender.indexOf(' ') + 1).trim()
          currentSender = currentSender.substr(0, currentSender.indexOf(' ')).trim()
        }
        currentLines = []
      } else {
        currentLines.push(line)
      }
    })
    pushPrev()

    return Promise.resolve(new Convo(convo))
  }

  Decompile (convo) {
    let script = ''

    if (convo.header.name) {
      script += convo.header.name + EOL
    }
    if (convo.header.description) {
      script += convo.header.description + EOL
    }

    convo.conversation.forEach((set) => {
      if (!set.messageText && !set.sourceData) return

      script += EOL

      script += '#' + set.sender
      if (set.channel) {
        script += ' ' + set.channel
      }
      script += EOL

      if (set.messageText) {
        script += set.messageText + EOL
      } else if (set.sourceData) {
        script += JSON.stringify(set.sourceData, null, 2) + EOL
      }
    })
    return Promise.resolve(script)
  }
}
